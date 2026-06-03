const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = __dirname;
const DATA_DIR = path.resolve(ROOT, process.env.BVF_DATA_DIR || "data");
const VIBES_FILE = path.join(DATA_DIR, "vibes.json");
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const INVITE_CODE = process.env.BVF_INVITE_CODE || crypto.randomBytes(4).toString("hex");
const ADMIN_CODE = process.env.BVF_ADMIN_CODE || crypto.randomBytes(4).toString("hex");
const INVITE_CODE_IS_TEMPORARY = !process.env.BVF_INVITE_CODE;
const ADMIN_CODE_IS_TEMPORARY = !process.env.BVF_ADMIN_CODE;
const COOKIE_NAME = "bvf_session";
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_BODY_BYTES = 16 * 1024 * 1024;

const sessions = new Map();
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".flac": "audio/flac",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".otf": "font/otf",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".wav": "audio/wav"
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/api/")) {
      await handleApi(req, res);
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    console.error(error);
    sendJson(res, error.statusCode || 500, { error: error.publicCode || "server_error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`bad vibes forever is public at http://localhost:${PORT}`);
  console.log(`Invite code${INVITE_CODE_IS_TEMPORARY ? " (temporary)" : ""}: ${INVITE_CODE}`);
  console.log(`Admin code${ADMIN_CODE_IS_TEMPORARY ? " (temporary)" : ""}: ${ADMIN_CODE}`);
  console.log("Set BVF_INVITE_CODE and BVF_ADMIN_CODE before starting the server to keep stable codes.");
});

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/session") {
    sendJson(res, 200, currentSession(req));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/login") {
    const body = await readJson(req);
    const code = cleanText(body.code, 120);
    let role = null;
    let user = null;

    if (code && code === ADMIN_CODE) {
      role = "admin";
      user = "管理员";
    } else if (code && code === INVITE_CODE) {
      role = "writer";
      user = "受邀访客";
    }

    if (!role) {
      sendJson(res, 401, { error: "invalid_login" });
      return;
    }

    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, { user, role, createdAt: Date.now() });
    res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax`);
    sendJson(res, 200, toSessionPayload(sessions.get(token)));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/logout") {
    const token = getCookie(req, COOKIE_NAME);
    if (token) sessions.delete(token);
    res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
    sendJson(res, 200, emptySession());
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/vibes") {
    sendJson(res, 200, await readVibes());
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/vibes") {
    requireWriteAccess(req, res);
    if (res.writableEnded) return;

    const body = await readJson(req);
    const vibes = await readVibes();
    const vibe = sanitizeVibe(body);
    if (!vibe.body) {
      sendJson(res, 400, { error: "empty_vibe" });
      return;
    }
    vibes.unshift(vibe);
    await writeVibes(vibes);
    sendJson(res, 201, vibe);
    return;
  }

  const reactionMatch = url.pathname.match(/^\/api\/vibes\/([^/]+)\/reactions$/);
  if (req.method === "PATCH" && reactionMatch) {
    requireWriteAccess(req, res);
    if (res.writableEnded) return;

    const body = await readJson(req);
    const vibe = await mutateVibe(reactionMatch[1], (item) => {
      if (!item.reactions || typeof item.reactions[body.reaction] !== "number") return false;
      item.reactions[body.reaction] += 1;
      return true;
    });
    if (!vibe) {
      sendJson(res, 404, { error: "not_found" });
      return;
    }
    sendJson(res, 200, vibe);
    return;
  }

  const replyMatch = url.pathname.match(/^\/api\/vibes\/([^/]+)\/replies$/);
  if (req.method === "POST" && replyMatch) {
    requireWriteAccess(req, res);
    if (res.writableEnded) return;

    const body = await readJson(req);
    const replyBody = cleanText(body.body, 220);
    if (!replyBody) {
      sendJson(res, 400, { error: "empty_reply" });
      return;
    }

    const vibe = await mutateVibe(replyMatch[1], (item) => {
      item.replies = Array.isArray(item.replies) ? item.replies : [];
      item.replies.push({
        id: crypto.randomUUID(),
        author: currentSession(req).user || "路过的人",
        body: replyBody,
        createdAt: new Date().toISOString()
      });
      return true;
    });
    if (!vibe) {
      sendJson(res, 404, { error: "not_found" });
      return;
    }
    sendJson(res, 200, vibe);
    return;
  }

  if (req.method === "DELETE" && url.pathname === "/api/vibes") {
    requireAdmin(req, res);
    if (res.writableEnded) return;

    const theme = url.searchParams.get("theme");
    const vibes = await readVibes();
    const nextVibes = theme ? vibes.filter((vibe) => vibe.theme !== theme) : [];
    await writeVibes(nextVibes);
    sendJson(res, 200, nextVibes);
    return;
  }

  sendJson(res, 404, { error: "not_found" });
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(ROOT, requestedPath));
  const relativePath = path.relative(ROOT, filePath);
  const dataRelativePath = path.relative(DATA_DIR, filePath);

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath) ||
    (!dataRelativePath.startsWith("..") && !path.isAbsolute(dataRelativePath)) ||
    relativePath === ".git" ||
    relativePath.startsWith(`.git${path.sep}`) ||
    relativePath === "data" ||
    relativePath.startsWith(`data${path.sep}`)
  ) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

function requireWriteAccess(req, res) {
  if (!currentSession(req).authenticated) sendJson(res, 401, { error: "login_required" });
}

function requireAdmin(req, res) {
  if (!currentSession(req).canManage) sendJson(res, 403, { error: "admin_required" });
}

function currentSession(req) {
  const token = getCookie(req, COOKIE_NAME);
  const session = token ? sessions.get(token) : null;
  return session ? toSessionPayload(session) : emptySession();
}

function toSessionPayload(session) {
  return {
    authenticated: true,
    canManage: session.role === "admin",
    role: session.role,
    user: session.user
  };
}

function emptySession() {
  return { authenticated: false, canManage: false, role: null, user: null };
}

function getCookie(req, name) {
  const cookie = req.headers.cookie || "";
  const pair = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : "";
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw publicError(413, "request_too_large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(value));
}

async function readVibes() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    return JSON.parse(await fs.readFile(VIBES_FILE, "utf8"));
  } catch {
    await writeVibes([]);
    return [];
  }
}

async function writeVibes(vibes) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(VIBES_FILE, JSON.stringify(vibes, null, 2), "utf8");
}

async function mutateVibe(id, change) {
  const vibes = await readVibes();
  const vibe = vibes.find((item) => item.id === id);
  if (!vibe || !change(vibe)) return null;
  await writeVibes(vibes);
  return vibe;
}

function sanitizeVibe(input) {
  const theme = input.theme === "good" ? "good" : "bad";
  const reactions = input.reactions && typeof input.reactions === "object" ? input.reactions : {};
  return {
    id: crypto.randomUUID(),
    theme,
    category: cleanText(input.category, 24) || (theme === "good" ? "希望" : "孤独"),
    body: cleanText(input.body, 600),
    author: cleanText(input.author, 24) || currentDisplayName(),
    createdAt: new Date().toISOString(),
    mediaIds: [],
    linkAttachments: Array.isArray(input.linkAttachments) ? input.linkAttachments.slice(0, 4).map(sanitizeAttachment).filter(Boolean) : [],
    noteColor: cleanText(input.noteColor, 24) || "fog",
    autoReply: cleanText(input.autoReply, 300),
    reactions: Object.fromEntries(Object.keys(reactions).slice(0, 6).map((key) => [cleanText(key, 24), 0])),
    replies: []
  };
}

function sanitizeAttachment(attachment) {
  if (!attachment || typeof attachment !== "object") return null;
  const type = ["image", "audio", "link"].includes(attachment.type) ? attachment.type : "link";
  const rawUrl = String(attachment.url || "").trim();
  if (type !== "link" && isDataUrl(rawUrl) && dataUrlByteLength(rawUrl) > MAX_ATTACHMENT_BYTES) {
    throw publicError(400, "attachment_too_large");
  }
  if (type === "link" && rawUrl.length > 2048) {
    throw publicError(400, "link_too_long");
  }
  const maxLength = type === "link" ? 2048 : dataUrlMaxLength(MAX_ATTACHMENT_BYTES);
  const url = cleanText(rawUrl, maxLength);
  return url ? { url, type } : null;
}

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function isDataUrl(url) {
  return /^data:[^,]+,/.test(url);
}

function dataUrlByteLength(url) {
  const commaIndex = url.indexOf(",");
  if (commaIndex === -1) return 0;
  const meta = url.slice(0, commaIndex);
  const payload = url.slice(commaIndex + 1);
  if (meta.endsWith(";base64")) {
    const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
    return Math.floor((payload.length * 3) / 4) - padding;
  }
  return Buffer.byteLength(decodeURIComponent(payload), "utf8");
}

function dataUrlMaxLength(bytes) {
  return Math.ceil(bytes * 4 / 3) + 256;
}

function publicError(statusCode, publicCode) {
  const error = new Error(publicCode);
  error.statusCode = statusCode;
  error.publicCode = publicCode;
  return error;
}

function currentDisplayName() {
  return "匿名";
}

const crypto = require("node:crypto");

const INVITE_CODE = process.env.BVF_INVITE_CODE || "";
const ADMIN_CODE = process.env.BVF_ADMIN_CODE || "";
const COOKIE_NAME = "bvf_session";
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const MAX_BODY_BYTES = 16 * 1024 * 1024;
const VIBES_KEY = process.env.BVF_VIBES_KEY || "bvf:vibes";

module.exports = async function handler(req, res) {
  try {
    await handleApi(req, res);
  } catch (error) {
    console.error(error);
    sendJson(res, error.statusCode || 500, { error: error.publicCode || "server_error" });
  }
};

async function handleApi(req, res) {
  const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const pathname = url.pathname.replace(/^\/api/, "") || "/";

  if (req.method === "GET" && pathname === "/session") {
    sendJson(res, 200, currentSession(req));
    return;
  }

  if (req.method === "POST" && pathname === "/login") {
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

    const token = signSession({ role, user, createdAt: Date.now() });
    res.setHeader("Set-Cookie", `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure`);
    sendJson(res, 200, toSessionPayload({ role, user }));
    return;
  }

  if (req.method === "POST" && pathname === "/logout") {
    res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);
    sendJson(res, 200, emptySession());
    return;
  }

  if (req.method === "GET" && pathname === "/vibes") {
    sendJson(res, 200, await readVibes());
    return;
  }

  if (req.method === "POST" && pathname === "/vibes") {
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

  const reactionMatch = pathname.match(/^\/vibes\/([^/]+)\/reactions$/);
  if (req.method === "PATCH" && reactionMatch) {
    requireWriteAccess(req, res);
    if (res.writableEnded) return;

    const body = await readJson(req);
    const vibe = await mutateVibe(decodeURIComponent(reactionMatch[1]), (item) => {
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

  const replyMatch = pathname.match(/^\/vibes\/([^/]+)\/replies$/);
  if (req.method === "POST" && replyMatch) {
    requireWriteAccess(req, res);
    if (res.writableEnded) return;

    const body = await readJson(req);
    const replyBody = cleanText(body.body, 220);
    if (!replyBody) {
      sendJson(res, 400, { error: "empty_reply" });
      return;
    }

    const vibe = await mutateVibe(decodeURIComponent(replyMatch[1]), (item) => {
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

  if (req.method === "DELETE" && pathname === "/vibes") {
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

function requireWriteAccess(req, res) {
  if (!currentSession(req).authenticated) sendJson(res, 401, { error: "login_required" });
}

function requireAdmin(req, res) {
  if (!currentSession(req).canManage) sendJson(res, 403, { error: "admin_required" });
}

function currentSession(req) {
  const token = getCookie(req, COOKIE_NAME);
  const session = token ? verifySession(token) : null;
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

function signSession(session) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifySession(token) {
  const [payload, signature] = String(token).split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return session?.role ? session : null;
  } catch {
    return null;
  }
}

function getSessionSecret() {
  return process.env.BVF_SESSION_SECRET || ADMIN_CODE || INVITE_CODE || "bvf-dev-secret";
}

function getCookie(req, name) {
  const cookie = req.headers.cookie || "";
  const pair = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : "";
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};

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
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(value));
}

async function readVibes() {
  const value = await redisCommand(["GET", VIBES_KEY]);
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

async function writeVibes(vibes) {
  await redisCommand(["SET", VIBES_KEY, JSON.stringify(vibes)]);
}

async function mutateVibe(id, change) {
  const vibes = await readVibes();
  const vibe = vibes.find((item) => item.id === id);
  if (!vibe || !change(vibe)) return null;
  await writeVibes(vibes);
  return vibe;
}

async function redisCommand(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw publicError(503, "redis_not_configured");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) throw publicError(500, "redis_error");
  return data.result;
}

function sanitizeVibe(input) {
  const theme = input.theme === "good" ? "good" : "bad";
  const reactions = input.reactions && typeof input.reactions === "object" ? input.reactions : {};
  return {
    id: crypto.randomUUID(),
    theme,
    category: cleanText(input.category, 24) || (theme === "good" ? "希望" : "孤独"),
    body: cleanText(input.body, 600),
    author: cleanText(input.author, 24) || "匿名",
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
  const type = ["image", "audio", "link", "netease"].includes(attachment.type) ? attachment.type : "link";
  const rawUrl = String(attachment.url || "").trim();
  const isExternalLink = type === "link" || type === "netease";
  if (!isExternalLink && isDataUrl(rawUrl) && dataUrlByteLength(rawUrl) > MAX_ATTACHMENT_BYTES) {
    throw publicError(400, "attachment_too_large");
  }
  if (isExternalLink && rawUrl.length > 2048) {
    throw publicError(400, "link_too_long");
  }
  const maxLength = isExternalLink ? 2048 : dataUrlMaxLength(MAX_ATTACHMENT_BYTES);
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

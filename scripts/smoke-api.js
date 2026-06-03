const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const PORT = 4310;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DATA_DIR = path.join(ROOT, "tmp", "smoke-api-data");
const INVITE_CODE = "invite-smoke";
const ADMIN_CODE = "admin-smoke";

let server;

main().catch(async (error) => {
  console.error(error);
  await cleanup();
  process.exit(1);
});

async function main() {
  await fs.rm(DATA_DIR, { recursive: true, force: true });
  server = spawn(process.execPath, ["server.js"], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(PORT),
      HOST: "127.0.0.1",
      BVF_DATA_DIR: DATA_DIR,
      BVF_INVITE_CODE: INVITE_CODE,
      BVF_ADMIN_CODE: ADMIN_CODE
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  server.stdout.on("data", (chunk) => process.stdout.write(chunk));
  server.stderr.on("data", (chunk) => process.stderr.write(chunk));
  await waitForServer();

  const publicSession = await request("/api/session");
  assert(publicSession.body.authenticated === false, "public session should be anonymous");

  const writer = await request("/api/login", {
    method: "POST",
    body: { code: INVITE_CODE }
  });
  assert(writer.body.role === "writer", "invite code should create writer session");

  const vibe = await request("/api/vibes", {
    method: "POST",
    cookie: writer.cookie,
    body: {
      theme: "bad",
      category: "焦虑",
      body: "smoke api vibe",
      author: "tester",
      noteColor: "blue",
      autoReply: "smoke reply",
      reactions: { "我听见了": 0, "抱一下": 0 },
      linkAttachments: []
    }
  });
  assert(vibe.body.body === "smoke api vibe", "created vibe should echo body");

  const reacted = await request(`/api/vibes/${encodeURIComponent(vibe.body.id)}/reactions`, {
    method: "PATCH",
    cookie: writer.cookie,
    body: { reaction: "我听见了" }
  });
  assert(reacted.body.reactions["我听见了"] === 1, "reaction should increment");

  const replied = await request(`/api/vibes/${encodeURIComponent(vibe.body.id)}/replies`, {
    method: "POST",
    cookie: writer.cookie,
    body: { body: "路过一下" }
  });
  assert(replied.body.replies.length === 1, "reply should be stored");

  const admin = await request("/api/login", {
    method: "POST",
    body: { code: ADMIN_CODE }
  });
  assert(admin.body.canManage === true, "admin code should create admin session");

  const cleared = await request("/api/vibes?theme=bad", {
    method: "DELETE",
    cookie: admin.cookie
  });
  assert(Array.isArray(cleared.body) && cleared.body.length === 0, "admin clear should remove bad vibes");

  await cleanup();
  console.log("smoke:api passed");
}

async function request(pathname, options = {}) {
  const headers = {};
  if (options.body) headers["Content-Type"] = "application/json";
  if (options.cookie) headers.Cookie = options.cookie;

  const response = await fetch(`${BASE_URL}${pathname}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${options.method || "GET"} ${pathname} failed: ${response.status} ${JSON.stringify(body)}`);
  return {
    body,
    cookie: response.headers.get("set-cookie")?.split(";")[0] || options.cookie || ""
  };
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      await request("/api/session");
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("server did not start");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function cleanup() {
  if (server && !server.killed) {
    server.kill();
    await new Promise((resolve) => server.once("exit", resolve));
  }
  await fs.rm(DATA_DIR, { recursive: true, force: true });
}

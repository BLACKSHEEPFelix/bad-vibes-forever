# Temporary public access

This project is designed for a temporary public test link.

## 1. Start the local server

Set stable codes before starting the server:

```powershell
$env:BVF_INVITE_CODE="change-this-invite-code"
$env:BVF_ADMIN_CODE="change-this-admin-code"
npm start
```

If the variables are not set, `server.js` prints temporary invite and admin codes for the current run.

## 2. Start the Cloudflare tunnel

Before sharing, run:

```powershell
npm.cmd test
```

Open another terminal:

```powershell
npm run tunnel
```

Copy the `https://...trycloudflare.com` URL from the terminal and send it to friends.

## 3. Permissions

- Anyone with the URL can browse the wall.
- Anyone with the invite code can post vibes, react, and reply.
- Only the admin code can clear shared vibes.

The tunnel link is temporary. If the computer, local server, or tunnel stops, the public link stops working.

# Bad Vibes Forever

A small local-first vibe wall for saving bad and good moods, with invite-only posting, reactions, replies, media attachments, and temporary public sharing through a Cloudflare tunnel.

## What is Done

- Bad vibes and good vibes modes with separate copy, colors, categories, reactions, and background music.
- Local browser fallback with `localStorage` and IndexedDB media storage.
- Shared server mode with invite-code posting and admin-only clearing.
- Optional image, audio, and link attachments.
- Image-backed preview cards, audio previews, and detail views ordered as image, text, then audio.
- Temporary public access instructions in `PUBLIC-ACCESS.md`.

## Start Locally

```powershell
node server.js
```

Then open:

```text
http://localhost:3000
```

If you prefer npm on Windows PowerShell and `npm start` is blocked by script policy, use:

```powershell
npm.cmd start
```

## Stable Invite Codes

Set codes before starting the server:

```powershell
$env:BVF_INVITE_CODE="change-this-invite-code"
$env:BVF_ADMIN_CODE="change-this-admin-code"
node server.js
```

If these variables are not set, the server prints temporary codes for that run.

## Check Before Sharing

Run:

```powershell
npm.cmd test
```

This runs syntax checks plus API and browser smoke tests. If Playwright asks for a browser install on the first run, use:

```powershell
npx playwright install chromium
```

Then manually verify:

- The page loads at `http://localhost:3000`.
- `/api/session` returns an unauthenticated public session.
- `/api/vibes` returns the shared vibe list.
- Invite code can post, react, and reply.
- Admin code can clear vibes.
- Bad/good mode switching updates copy, colors, music, and visible posts.
- The splash animation appears on page load, then background music starts automatically or on the first click if the browser blocks autoplay.
- Cards with images use a readable gradient image preview, and audio appears below the preview text.
- Opening a card shows image, text, then audio; flipping shows the smart reply and passerby replies.
- The side sheep remains visible on mobile width.

## Upload Limits

- Image uploads: 5 MB per file.
- Audio uploads: 5 MB per file.
- Shared-mode files are sent as data URLs, so very large posts are rejected before they are saved.
- Plain links can still be used for externally hosted images or audio.

## Public Test Link

See `PUBLIC-ACCESS.md` for the Cloudflare tunnel flow.

## Current Limits

- Sessions are in memory, so login state resets when the server restarts.
- Shared vibes are stored in `data/vibes.json`; this is simple and fine for small tests, but not a production database.
- Uploaded files in shared mode are converted to data URLs, so 5 MB files are still relatively heavy over slow networks.
- Browser autoplay policies can block immediate music playback until the visitor first clicks or presses a key.

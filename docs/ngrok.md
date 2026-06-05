# Going Live with ngrok

This walks you through exposing both the **frontend (Next.js, port 3000)** and the
**backend (NestJS, port 4000)** through ngrok so two people on different networks
can sign up and call each other.

Audio runs over **LiveKit Cloud** (already configured in `backend/.env`), so we
don't need to tunnel UDP — only the HTTP + WebSocket traffic to your laptop.

The codebase already handles:
- **Cross-origin cookies** — `COOKIE_SECURE=true` triggers `SameSite=None` cookies.
- **ngrok browser-warning bypass** — API + Socket.IO requests send the
  `ngrok-skip-browser-warning` header automatically.
- **Multi-origin CORS** — `FRONTEND_ORIGIN` accepts a comma-separated list.

## 1. One-time ngrok setup

Get a free authtoken at https://dashboard.ngrok.com/get-started/your-authtoken, then:

```powershell
ngrok config add-authtoken <YOUR_TOKEN>
```

## 2. Make sure both services are running

```powershell
# in three separate terminals
docker compose up -d postgres redis
cd backend  ; npm run start:dev    # listens on :4000
cd frontend ; npm run dev          # listens on :3000
```

## 3. Start both tunnels

```powershell
.\scripts\start-ngrok.ps1
```

The script will print something like:

```
backend (api): https://1234-abcd.ngrok-free.app
frontend (web): https://5678-efgh.ngrok-free.app

---- paste into backend/.env ----
FRONTEND_ORIGIN=https://5678-efgh.ngrok-free.app
COOKIE_SECURE=true
COOKIE_DOMAIN=

---- paste into frontend/.env.local ----
NEXT_PUBLIC_API_URL=https://1234-abcd.ngrok-free.app/api
NEXT_PUBLIC_WS_URL=https://1234-abcd.ngrok-free.app
```

ngrok dashboard is at http://localhost:4040 if you want to inspect requests.

## 4. Paste the URLs into env files, restart

Update `backend/.env` and `frontend/.env.local` with the values printed above,
then **restart both backend and frontend** (the env vars are read at boot).

If you want to keep `http://localhost:3000` working too, set:
```
FRONTEND_ORIGIN=https://5678-efgh.ngrok-free.app,http://localhost:3000
```

## 5. Test with two people

1. Send the **frontend URL** to a friend.
2. Both open it. ngrok shows a one-time "Visit Site" warning — click through.
3. Both sign up with different usernames.
4. One person searches for the other's username and hits **Hail**.
5. The other accepts. Audio room opens for both.

## Common pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Login succeeds but `/auth/me` returns 401 | Cookies not being sent cross-site | Make sure `COOKIE_SECURE=true` and `COOKIE_DOMAIN=` (empty) in `backend/.env`, then restart |
| CORS error in browser console | `FRONTEND_ORIGIN` doesn't match the ngrok URL exactly | Copy the URL exactly (no trailing slash); restart backend |
| Socket.IO disconnects every ~10s | Free-tier interstitial blocking polling | We send `ngrok-skip-browser-warning` already; if it still happens, visit the backend URL once in the same browser to clear the warning cookie |
| Audio silence | Mic permission denied; or LiveKit URL not reachable | Check browser site settings; verify `LIVEKIT_MODE=cloud` and the cloud creds in `backend/.env` |
| ngrok session expired | Free tier sessions cap at 8h | Restart `.\scripts\start-ngrok.ps1`, update env vars again |

## Static URLs (optional)

Free accounts get **one** free static domain per region. If you claim it for the
backend, your frontend env vars stay stable across restarts. Update `ngrok.yml`:

```yaml
tunnels:
  api:
    proto: http
    addr: 4000
    domain: your-static-name.ngrok-free.app
  web:
    proto: http
    addr: 3000
```

(The frontend tunnel will still get a random URL on free tier unless you upgrade.)

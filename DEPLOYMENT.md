# Deploy Whisper: Netlify (frontend) + Render (backend)

## Architecture

| Part | Host | URL example |
|------|------|-------------|
| React (Vite) | **Netlify** | `https://your-app.netlify.app` |
| Spring Boot + WebSocket | **Render** (Docker) | `https://secret-api.onrender.com` |

The frontend calls the API and WebSocket **directly** on Render (`VITE_API_URL`). Netlify only serves static files.

---

## 1. Backend on Render (Docker)

### Option A — Blueprint (`render.yaml`)

1. Push this repo to GitHub.
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → connect repo.
3. Render creates `secret-api` from `render.yaml`.
4. After deploy, copy the service URL (e.g. `https://secret-api.onrender.com`).

### Option B — Manual Web Service

1. **New** → **Web Service** → connect repo.
2. **Runtime**: Docker  
3. **Dockerfile path**: `./Dockerfile`  
4. **Health check path**: `/health`  
5. **Instance type**: Free (or paid for always-on).

### Environment variables (Render → Environment)

| Key | Value |
|-----|--------|
| `PORT` | `8080` (Render often sets this automatically) |
| `APP_CORS_ALLOWED_ORIGIN_PATTERNS` | `https://your-app.netlify.app,https://*.netlify.app,http://localhost:*` |

Replace `your-app` with your real Netlify subdomain. Use a comma-separated list for multiple sites.

### Verify backend

```text
GET https://secret-api.onrender.com/health
→ {"status":"UP"}
```

### Local Docker test

```bash
docker build -t secret-api .
docker run -p 8080:8080 -e APP_CORS_ALLOWED_ORIGIN_PATTERNS="http://localhost:*" secret-api
```

---

## 2. Frontend on Netlify

1. [Netlify](https://app.netlify.com) → **Add new site** → **Import from Git**.
2. **Base directory**: `frontend`
3. **Build command**: `npm ci && npm run build` (or use `netlify.toml` in `frontend/`)
4. **Publish directory**: `frontend/dist`

### Required environment variable (Netlify → Site configuration → Environment variables)

| Key | Value | Scopes |
|-----|--------|--------|
| `VITE_API_URL` | `https://secret-api.onrender.com` | **Build** (and optionally Deploy previews) |

**No trailing slash.** Rebuild after changing this variable (Vite bakes it in at build time).

### Verify frontend

Open the Netlify URL → join chat → network tab should call `https://secret-api.onrender.com/users` and WebSocket `.../ws`.

---

## 3. Render free tier: 15-minute idle spin-down

On the **free** web service plan, Render stops your app after roughly **15 minutes** with no HTTP traffic. The next request triggers a **cold start** (often 30–60+ seconds). WebSocket connections drop when the instance sleeps.

### Proper solutions (recommended)

| Approach | Notes |
|----------|--------|
| **Render paid plan** | Starter ($7/mo) and above keeps the service running without spin-down. |
| **Accept cold starts** | Fine for demos; show a “Connecting…” state in the UI. |

### Free-tier workaround (uptime ping)

Use an external monitor to hit your app every **5–10 minutes** so it rarely idles:

1. [UptimeRobot](https://uptimerobot.com) (free) or [cron-job.org](https://cron-job.org)
2. Create an HTTP monitor:
   - **URL**: `https://secret-api.onrender.com/health`
   - **Interval**: every **5 minutes**
3. Saves cost vs 1-minute pings; usually enough to stay under the 15-minute idle window.

**Caveats:**

- Not guaranteed by Render; behavior can change.
- Still **not** true 24/7 SLA—occasional sleep or failed pings can happen.
- In-memory data (users, messages) is **lost** on every restart anyway.
- Heavy use of free-tier keep-alive may conflict with provider fair-use; paid plan is the right fix for production.

There is **no official Render setting** on free tier to disable spin-down completely.

---

## 4. Checklist before go-live

- [ ] Render `/health` returns `UP`
- [ ] `APP_CORS_ALLOWED_ORIGIN_PATTERNS` includes your Netlify URL
- [ ] Netlify `VITE_API_URL` points to Render (rebuild after setting)
- [ ] WebSocket: browser connects to `wss://secret-api.onrender.com/ws` (HTTPS → WSS)
- [ ] Optional: UptimeRobot on `/health` every 5 min (free tier only)

---

## 5. Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors in browser | Add exact Netlify origin to `APP_CORS_ALLOWED_ORIGIN_PATTERNS` on Render |
| API calls go to Netlify domain | `VITE_API_URL` missing or wrong; trigger new Netlify build |
| WebSocket fails | Backend asleep (cold start); wait and retry; check Render logs |
| 502 on Render | Container still starting; check Dockerfile build logs |
| Data disappears | Expected: in-memory stores reset when Render restarts or spins down |

---

## 6. Order of deployment

1. Deploy **Render** first → get API URL.  
2. Set **Netlify** `VITE_API_URL` → deploy frontend.  
3. Update Render CORS with your Netlify URL if needed.  
4. (Optional) Configure uptime ping on `/health`.

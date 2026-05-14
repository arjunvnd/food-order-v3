# Deployment Guide

This monorepo contains three apps deployed across two platforms:

| App | Platform | URL |
|-----|----------|-----|
| `food-order-dashboard-be` + `food-order-v2` | **Render** (single service) | `https://<your-app>.onrender.com` |
| `food-order-landing` | **Vercel** | `https://<your-landing>.vercel.app` |
| PostgreSQL | **Neon** | managed, no public URL |

---

## How It Works

### Combined Backend + Dashboard (Render)

The Express backend (`food-order-dashboard-be`) and the React dashboard (`food-order-v2`) are deployed as a **single service on Render**.

At build time, Vite compiles the React app into a static `food-order-v2/dist/` folder. Express then serves that folder directly in production via `express.static()`. This works because:

- All API calls from the frontend use the relative base URL `/api` — no cross-origin requests, no CORS needed in production.
- React Router is supported via a catch-all `GET *` route that serves `index.html` for any non-`/api` path.
- In local development nothing changes — Vite runs on port 5173 and talks to the backend on port 3000 as before.

The relevant code block in `food-order-dashboard-be/src/app.ts`:

```ts
if (config.nodeEnv === 'production') {
  const frontendDist = path.resolve(__dirname, '../../food-order-v2/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}
```

`__dirname` in the compiled output is `food-order-dashboard-be/dist/`, so `../../food-order-v2/dist` resolves correctly to the sibling app's build output.

### Landing Page (Vercel)

`food-order-landing` is a Next.js app deployed independently on Vercel. Vercel detects Next.js automatically and handles the build and SSR. The contact form API route (`/api/inquiry`) runs as a Vercel Serverless Function.

### Deploy Pipelines (GitHub Actions — manual trigger)

Two workflows live under `.github/workflows/`. Both use `workflow_dispatch`, which adds a **"Run workflow"** button in the GitHub Actions tab. There is no automatic deploy on push — you trigger deploys deliberately.

**`deploy-combined.yml`** — hits the Render Deploy Hook URL via `curl`. Render then pulls the latest commit, runs the build command, and restarts the service.

**`deploy-landing.yml`** — checks out the repo, installs the Vercel CLI, and runs `vercel --prod` scoped to the `food-order-landing` directory.

---

## One-Time Setup Checklist

Complete these steps once before the first deploy. Work through them in order — each step produces a value needed by the next.

### 1. Neon (PostgreSQL)

- [ ] Sign up at https://neon.tech
- [ ] Create a new project and database (e.g. `food-order`)
- [ ] Copy the **pooled** connection string — this is your `DATABASE_URL`
- [ ] Keep it handy for Step 2

### 2. Render (Backend + Dashboard)

- [ ] Sign up / log in at https://render.com
- [ ] Click **New → Web Service** → connect your GitHub repo (`arjunvnd/food-order-v3`)
- [ ] Leave **Root Directory** blank (Render needs the monorepo root)
- [ ] Set the following:

  | Field | Value |
  |-------|-------|
  | **Build Command** | `npm install && cd food-order-dashboard-be && npx prisma generate && cd .. && npm run build` |
  | **Pre-Deploy Command** | `cd food-order-dashboard-be && npx prisma migrate deploy` |
  | **Start Command** | `cd food-order-dashboard-be && node dist/server.js` |

- [ ] Add **Environment Variables** on Render:

  | Key | Value / Notes |
  |-----|--------------|
  | `NODE_ENV` | `production` |
  | `DATABASE_URL` | pooled connection string from Neon |
  | `AUTH0_DOMAIN` | e.g. `your-tenant.us.auth0.com` |
  | `AUTH0_AUDIENCE` | e.g. `https://food-order-app/api` |
  | `AUTH0_CLIENT_ID` | SPA client ID from Auth0 |
  | `AUTH0_MGMT_CLIENT_ID` | M2M app client ID |
  | `AUTH0_MGMT_CLIENT_SECRET` | M2M app client secret |
  | `FRONTEND_URL` | your Render URL (set after first deploy, used for CORS in dev fallback) |
  | `VITE_AUTH0_DOMAIN` | same as `AUTH0_DOMAIN` — read by Vite at build time |
  | `VITE_AUTH0_CLIENT_ID` | same as `AUTH0_CLIENT_ID` — read by Vite at build time |
  | `VITE_AUTH0_AUDIENCE` | same as `AUTH0_AUDIENCE` — read by Vite at build time |
  | `VITE_API_BASE_URL` | `/api` — relative, works same-origin |
  | `VITE_WS_URL` | `wss://<your-app>.onrender.com` — set after first deploy |

- [ ] Deploy and note your Render URL (e.g. `https://food-order-xyz.onrender.com`)
- [ ] Go back and fill in `FRONTEND_URL` and `VITE_WS_URL` with that URL, then redeploy

- [ ] In Render dashboard → your service → **Settings → Deploy Hook** → copy the hook URL for Step 4

### 3. Vercel (Landing Page)

- [ ] Sign up / log in at https://vercel.com
- [ ] Click **Add New → Project** → import `arjunvnd/food-order-v3`
- [ ] Set **Root Directory** to `food-order-landing`
- [ ] Vercel auto-detects Next.js — no build command changes needed
- [ ] Add environment variables if needed:

  | Key | Value |
  |-----|-------|
  | `RESEND_API_KEY` | from https://resend.com (for contact form emails) |

- [ ] Deploy and note your Vercel URL

- [ ] Inside `food-order-landing/`, run the following locally to get the project IDs needed for Step 4:
  ```bash
  npx vercel link
  # Follow the prompts — this creates .vercel/project.json with orgId and projectId
  cat food-order-landing/.vercel/project.json
  ```

### 4. GitHub Secrets

- [ ] In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**
- [ ] Add these four secrets:

  | Secret Name | Where to get it |
  |-------------|----------------|
  | `RENDER_DEPLOY_HOOK_URL` | Render dashboard → your service → Settings → Deploy Hook |
  | `VERCEL_TOKEN` | https://vercel.com → Account Settings → Tokens → Create |
  | `VERCEL_ORG_ID` | `orgId` field from `food-order-landing/.vercel/project.json` |
  | `VERCEL_PROJECT_ID_LANDING` | `projectId` field from `food-order-landing/.vercel/project.json` |

### 5. Auth0

- [ ] In your Auth0 dashboard → your SPA application → **Settings**
- [ ] Add your Render URL to:
  - **Allowed Callback URLs** — `https://<your-app>.onrender.com`
  - **Allowed Logout URLs** — `https://<your-app>.onrender.com`
  - **Allowed Web Origins** — `https://<your-app>.onrender.com`
- [ ] Save changes

---

## Triggering a Deploy

Once setup is complete, go to **GitHub → your repo → Actions tab**.

- To deploy backend + dashboard: click **"Deploy — Backend + Dashboard (Render)"** → **Run workflow**
- To deploy landing page: click **"Deploy — Landing Page (Vercel)"** → **Run workflow**

Each workflow shows live logs and a pass/fail status.

---

## Verifying a Deploy

After deploying, check these in order:

1. `https://<your-app>.onrender.com/api/docs` — Scalar API docs page loads (confirms Express is up)
2. `https://<your-app>.onrender.com` — React dashboard loads, Auth0 login works
3. Place a test order in the dashboard → confirm real-time Socket.io update arrives (confirms WebSocket works)
4. `https://<your-landing>.vercel.app` — landing page renders, contact form submits without error

---

## Known Limitations (Free Tier)

| Limitation | Detail |
|-----------|--------|
| **Render cold start** | Free services sleep after 15 min of inactivity. First request after sleep takes ~30–50 s to respond. Socket.io clients reconnect automatically. |
| **Neon storage** | 0.5 GB on free tier, 1 project max |
| **File uploads** | `uploads/` is stored on Render's ephemeral disk — files are wiped on each deploy/restart. Migrate to Cloudinary or S3 when file persistence is needed. |
| **Render build minutes** | 500 free build minutes/month. Each deploy takes ~3–5 min, so ~100 deploys/month before limits. |
| **GitHub Actions minutes** | 2,000 free minutes/month on private personal repos. Ample for this use case. |

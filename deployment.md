# Deployment Guide — RAG Production System

Deploy the **backend** (FastAPI + ChromaDB) on **Vercel** and the **frontend**
(Next.js) on **Render**.

```
Browser  ──►  Next.js on Render   ──►  FastAPI on Vercel
              (UI + /api/* proxy routes)       (/health, /upload, /search)
```

- The frontend never calls Vercel directly. It proxies through Next.js route
  handlers (`app/api/{health,search,upload}/route.ts`) using the
  `RAG_API_URL` env var. This means **no CORS issues** and the backend URL is
  never exposed to the browser.
- Your two folders are already separate GitHub repos:
  - Backend: `https://github.com/Callme-VR/backend_Rag.git`
  - Frontend: `https://github.com/Callme-VR/frentend_Rag.git`

---

## 0. Before you start (do this once)

1. **Accounts**
   - [vercel.com](https://vercel.com) (GitHub sign-in)
   - [render.com](https://render.com) (GitHub sign-in is fine)
2. **Commit + push pending changes.** The frontend repo currently has 2 modified
   files that are NOT committed (`app/api/health/route.ts`, `app/page.tsx`).
   From `D:\rag_Production\frentend`:

   ```powershell
   git add app/api/health/route.ts app/page.tsx
   git commit -m "Fix RSC directive and /api/health GET handler"
   git push origin master
   ```

3. **Never commit `.env` files.** Both `.gitignore` files already exclude them,
   so your secrets stay local. Vercel/Render env values are set via their dashboards.

---

## Part 1 — Backend on Vercel

### 1.1 Push the backend

```powershell
cd D:\rag_Production\backend
git add -A
git commit -m "Prepare backend for Vercel deployment"
git push origin master
```

### 1.2 Vercel configuration

Vercel needs to know which module exports the FastAPI app. The file
`backend/pyproject.toml` already contains:

```toml
[tool.vercel]
entrypoint = "api:app"
```

This tells Vercel to import the `app` variable from `backend/api.py`.

### 1.3 Import into Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project**.
2. Import the `backend_Rag` GitHub repo.
3. Vercel auto-detects **Python**. Settings:
   | Field | Value |
   |---|---|
   | Framework preset | `Python` (auto) |
   | Root directory | `/` |
   | Build command | `pip install -r requirements.txt` |
   | Install command | auto |
4. **Environment Variables**: no env vars required to run. If you ever need
   them, add them under **Project → Settings → Environment Variables** (never
   in a committed `.env`).
5. Click **Deploy**. Vercel clones, installs, and builds the backend as a
   serverless function.
6. After deploy, open `https://<your-project>.vercel.app/health` — you should
   see:
   ```json
   { "status": "healthy", "model": "all-MiniLM-L6-v2", "total_documents_in_store": 0 }
   ```
7. Copy the project URL — you need it for the frontend env var:
   `https://<your-project>.vercel.app`

### 1.4 Vercel backend caveats (important)

- **Cold starts.** Vercel serverless functions spin down after inactivity.
  The first request after a cold start must reload the `sentence-transformers`
  model (~90 MB) into memory, which can take **10–30 seconds**. Use the
  **Pro plan** (or higher) to reduce cold-start frequency and increase memory.
- **Memory limits.** Vercel Hobby plan allocates 1024 MB per function.
  Loading `torch` + `sentence-transformers` + `chromadb` may exceed this.
  Upgrade to Pro (3008 MB max) if you see OOM errors.
- **Execution timeout.** Hobby plan: 10 s per request. Pro plan: 60 s.
  The `/upload` endpoint processes documents and generates embeddings, which
  can exceed the Hobby timeout. Use Pro or keep uploads small.
- **Ephemeral filesystem.** Vercel's serverless functions have a read-only
  filesystem at deploy time. Any writes to `./chroma_db` or `./Uploads` are
  lost on each cold start and between deploys. For persistent storage:
  - Use an external database (e.g., a managed ChromaDB or Pinecone)
  - Or switch the backend to a Docker-based deployment on a platform that
    supports persistent volumes
- **No `uvicorn` needed.** Vercel runs the FastAPI app directly via its
  Python runtime. The `uvicorn api:app` start command from the Render
  approach is not used here.

---

## Part 2 — Frontend on Render

### 2.1 Push the frontend

```powershell
cd D:\rag_Production\frentend
git add -A
git commit -m "Prepare frontend for Render deployment"
git push origin master
```

### 2.2 Create the web service (dashboard steps)

1. Go to [render.com](https://dashboard.render.com) → **New** → **Web Service**.
2. **Connect a repository** → select `frentend_Rag` → **Connect**.
3. Fill the form:
   | Field | Value |
   |---|---|
   | Name | `rag-frontend` (any unique name) |
   | Runtime | `Node` |
   | Branch | `master` |
   | Region | nearest to you |
   | Build command | `npm install && npm run build` |
   | Start command | `npm start` |
   | Instance type | **Starter ($7/mo, 2 GB RAM) — recommended**. Free (512 MB) may be insufficient for Next.js with API routes |
   | Plan | pick one |

4. **Environment Variables**:
   | Key | Value |
   |---|---|
   | `RAG_API_URL` | `https://<your-project>.vercel.app` |

   > This is read server-side by the proxy routes in
   > `lib/config.ts`:
   > `process.env.RAG_API_URL ?? process.env.NEXT_PUBLIC_RAG_API_URL ?? "http://localhost:8000"`.

5. Click **Create Web Service** → Render clones, installs, and starts. Watch
   **Logs**.
6. When the log shows the Next.js server is ready, open
   `https://rag-frontend.onrender.com` in a browser — the status banner should
   turn **green** showing the model name and chunk count.
7. (Optional) Copy the service URL to your clipboard in the Render dashboard.

### 2.3 Render function timeouts (important)

The `/api/upload` proxy streams the file to Vercel; ChromaDB indexing +
embedding on Vercel can take longer than a default serverless function run:
- **Hobby plan**: functions run up to ~10 s by default (some up to 60 s).
- **Pro plan**: up to 300 s.

If uploads time out on the Hobby plan, either:
- Add `export const maxDuration = 60;` at the top of
  `app/api/upload/route.ts` (and `app/api/search/route.ts` if needed), or
- Upgrade to Pro, or
- Accept the limit and upload smaller documents.

### 2.4 Render caveats (important)

- **Ephemeral storage.** Render's filesystem is wiped on every redeploy and
  on free-tier restarts. Since the frontend is stateless (Next.js), this is
  not a concern for the frontend itself.
- **Free tier spin-down.** Free services sleep after ~15 min of inactivity;
  the next request triggers a slow cold start. Use at least the Starter plan
  for a real deployment.
- **Cold starts.** Render spins down free/Starter instances after inactivity.
  The first request after a spin-down triggers a Next.js cold start (rebuilding
  the server bundle), which can take several seconds.

### 2.5 Optional: `render.yaml` (infra-as-code)

You can skip the dashboard and put this at the **root of `frentend_Rag`**
(commit + push to trigger a Blueprint deploy from the Render dashboard → New → Blueprint):

```yaml
services:
  - type: web
    name: rag-frontend
    runtime: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: RAG_API_URL
        value: https://<your-project>.vercel.app
```

---

## Part 3 — Frontend on Netlify (alternative)

1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project** → pick `frentend_Rag`.
2. Configure:
   | Field | Value |
   |---|---|
   | Base directory | `/` |
   | Build command | `npm run build` |
   | Publish directory | `.next` |
3. **Environment Variables**:
   - `RAG_API_URL` = `https://<your-project>.vercel.app`
4. Deploy. Netlify auto-enables its Next.js runtime plugin for the `/api/*` routes.
5. Note: Netlify function timeout defaults to ~10 s (max ~26 s) — same large-upload
   caveat as Vercel above.

---

## Part 4 — Verification checklist

After both are deployed:

- [ ] `https://<your-project>.vercel.app/health` returns `"status": "healthy"`.
- [ ] `https://rag-frontend.onrender.com` shows **Backend online** (green banner).
- [ ] **Upload** a `.pdf` / `.txt` / `.md` — it reports chunks created.
- [ ] **Search** for a phrase from the document — ranked chunks with scores appear.
- [ ] Inspector tab shows the indexed chunk count and embedding model.

Troubleshooting if the banner stays red/offline:
1. Check `RAG_API_URL` in Render — must be exactly `https://<your-project>.vercel.app` (no trailing slash).
2. Open `https://<your-project>.vercel.app/health` directly — if it 404s or takes
   long, the model may still be loading (Vercel cold start). Wait and refresh.
3. Check **Render logs** (Dashboard → rag-frontend → Logs) for errors.
4. Open `https://rag-frontend.onrender.com/api/health` — it returns whatever the
   backend returns, so you can isolate whether the failure is proxy or backend.

---

## Known issues & notes

- **Type mismatch (frontend)**: `frentend/lib/types.ts` defines
  `HealthResponse.total_documents`, but the backend returns
  `total_documents_in_store`. The banner may show `undefined` for the chunk count.
  Rename the field to match if it bothers you.
- **No auth**: the backend has no authentication. Anyone with the Vercel URL can
  upload/search. For anything public, add an API key check in `api.py` and send it
  from the proxy routes.
- **CORS**: `api.py` uses `allow_origins=["*"]`. Safe behind the proxy, but consider
  restricting it to your frontend domain for production.
- **Hugging Face model download**: first boot downloads `all-MiniLM-L6-v2`. If Vercel
  can't reach Hugging Face, set `HF_HOME` to a Vercel persistent volume and retry.
- **Local `.env` files are untouched.** `backend/.env` and `frentend/.env` are
  gitignored and never deployed; only dashboard env vars are used in production.
# Frontend Roadmap & Code — RAG Production UI

This document is the **frontend plan + ready-to-use code** for the `frentend/` Next.js app.
It was written after analyzing the **backend** (`backend/api.py`, `backend/schemas.py`, `backend/app.py`, `backend/src/*`) and the current **frontend** scaffold (`frentend/` — Next.js 16.2.12, React 19, Tailwind v4, TypeScript, axios).

Nothing in the existing source is modified. Copy the code blocks below into the matching files.

---

## 1. What the backend already gives you

The FastAPI backend (`uvicorn api:app --reload --port 8000`) exposes exactly 3 endpoints the UI needs:

| Endpoint | Method | Request | Response |
|---|---|---|---|
| `/health` | GET | — | `{ status, model, total_documents_in_store }` |
| `/upload` | POST | multipart file field named `file` | `{ status, filename, saved_path, chunks_created, total_documents_in_store }` |
| `/search` | POST | `{ query, n_results }` | `{ query, total_results, results: [ { rank, score, content, metadata, id } ] }` |

Facts that drive the frontend design:

- Allowed upload extensions: `pdf, doc, docx, txt, rtf, json, pptx, csv, md` (max 200 MB).
- CORS is wide open (`allow_origins=["*"]`), but we still proxy through Next.js route handlers to keep the API URL on the server and get cleaner error handling.
- Metadata returned by search may contain: `original_filename`, `source_file`, `file_type`, `page`, `chunk_index`.
- Similarity `score` is `1 - (distance / 2)` → higher is better, range roughly `[0, 1]`.
- Uploads are **one file per request** — the UI must loop for multi-file upload.
- The existing Streamlit UI (`backend/app.py`) is the reference for the intended UX: 3 tabs (Search / Ingest / Inspector) + sidebar stats. We reproduce that in a modern Next.js UI.

---

## 2. Roadmap

### Phase 0 — Foundations (do first)
- [ ] Add `.env.local` with `RAG_API_URL=http://localhost:8000` (do **not** touch backend `.env`).
- [ ] Create `lib/types.ts` — TypeScript mirrors of the backend Pydantic schemas.
- [ ] Create `lib/config.ts` — central place for the backend URL.
- [ ] Create `lib/api.ts` — axios client that talks to our own route handlers.

### Phase 1 — API proxy (server-side)
- [ ] `app/api/health/route.ts` → forwards GET to backend `/health`.
- [ ] `app/api/search/route.ts` → forwards POST to backend `/search`.
- [ ] `app/api/upload/route.ts` → forwards multipart POST to backend `/upload`.
- [ ] Verify with Swagger UI (`http://localhost:8000/docs`) and the proxy in a browser.

### Phase 2 — Core UI
- [ ] Rewrite `app/page.tsx` into a dashboard: header + backend status banner + 3 tabs.
- [ ] `components/BackendStatus.tsx` — online/offline pill + health stats + refresh button.
- [ ] `components/SearchPanel.tsx` — query input, `k` slider (1–20), results with rank, score badge, source filename, page, expandable metadata.
- [ ] `components/UploadPanel.tsx` — drag & drop + file picker, extension validation, per-file progress messages, "Process & Index" button, success/error feedback, refresh stats after upload.
- [ ] `components/InspectorPanel.tsx` — aggregate stats cards from `/health`.

### Phase 3 — Polish
- [ ] Loading spinners for search/upload; empty & error states for every async action.
- [ ] Responsive layout (mobile: tabs wrap, panels stack).
- [ ] Follow Tailwind v4 + the Geist fonts already wired in `layout.tsx`.
- [ ] Run `npm run lint` and `npm run build`; fix warnings.

### Phase 4 — Production hardening (optional)
- [ ] Debounce search input (e.g. a small `useDeferredValue` hook) for fast typing.
- [ ] Add `loading.tsx` / `error.tsx` route-level files in `app/`.
- [ ] Move `RAG_API_URL` behind a real env at deploy time; restrict CORS on the backend.
- [ ] Add pagination for large result sets; add "copy chunk" / "jump to source file" actions.
- [ ] Add tests (Vitest + React Testing Library) for the 3 panels.

---

## 3. Code

### 3.0 Environment file

Create `.env.local` (in `frentend/`):

```bash
# FastAPI backend URL — read server-side by the Next.js route handlers.
RAG_API_URL=http://localhost:8000
```

### 3.1 `lib/config.ts`

```ts
export const RAG_API_URL =
  process.env.RAG_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";
```

### 3.2 `lib/types.ts`

```ts
export interface HealthResponse {
  status: string;
  model: string;
  total_documents_in_store: number;
}

export interface SearchResultItem {
  rank: number;
  score: number;
  content: string;
  metadata: Record<string, unknown>;
  id: string;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  results: SearchResultItem[];
}

export interface UploadResponse {
  status: string;
  filename: string;
  saved_path: string;
  chunks_created: number;
  total_documents_in_store: number;
}
```

### 3.3 `lib/api.ts`

```ts
import axios from "axios";
import type {
  HealthResponse,
  SearchResponse,
  UploadResponse,
} from "./types";

const http = axios.create({ timeout: 60_000 });

export async function fetchHealth(): Promise<HealthResponse> {
  const { data } = await http.get<HealthResponse>("/api/health");
  return data;
}

export async function runSearch(
  query: string,
  nResults: number
): Promise<SearchResponse> {
  const { data } = await http.post<SearchResponse>("/api/search", {
    query,
    n_results: nResults,
  });
  return data;
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await http.post<UploadResponse>("/api/upload", form);
  return data;
}
```

### 3.4 Route handlers (proxy to FastAPI)

`app/api/health/route.ts`:

```ts
import { RAG_API_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await fetch(`${RAG_API_URL}/health`, { cache: "no-store" });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
```

`app/api/search/route.ts`:

```ts
import { RAG_API_URL } from "@/lib/config";

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${RAG_API_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
```

`app/api/upload/route.ts`:

```ts
import { RAG_API_URL } from "@/lib/config";

export async function POST(request: Request) {
  const formData = await request.formData();
  const res = await fetch(`${RAG_API_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
```

### 3.5 `app/components/BackendStatus.tsx`

```tsx
"use client";

import type { HealthResponse } from "../lib/types";

interface Props {
  online: boolean;
  loading: boolean;
  health: HealthResponse | null;
  onRefresh: () => void;
}

export default function BackendStatus({
  online,
  loading,
  health,
  onRefresh,
}: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Checking backend health…</p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 shadow-sm ${
        online ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            online ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Backend {online ? "online" : "offline"}
          </p>
          {online && health ? (
            <p className="text-xs text-slate-500">
              {health.status} · model {health.model} ·{" "}
              {health.total_documents_in_store} chunk(s) indexed
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Could not reach the RAG backend. Run{" "}
              <code className="rounded bg-slate-200 px-1">
                uvicorn api:app --reload --port 8000
              </code>{" "}
              in <code className="rounded bg-slate-200 px-1">backend/</code>.
            </p>
          )}
        </div>
      </div>
      <button
        onClick={onRefresh}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
      >
        🔄 Refresh
      </button>
    </div>
  );
}
```

### 3.6 `app/components/SearchPanel.tsx`

```tsx
"use client";

import { useState } from "react";
import { runSearch } from "../lib/api";
import type { SearchResultItem } from "../lib/types";

interface Props {
  backendOnline: boolean;
}

function sourceName(meta: Record<string, unknown>): string {
  const m = meta as Record<string, string | undefined>;
  return (
    m.original_filename ??
    m.filename ??
    m.source_file ??
    m.source ??
    "Unknown Document"
  );
}

export default function SearchPanel({ backendOnline }: Props) {
  const [query, setQuery] = useState("");
  const [k, setK] = useState(5);
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await runSearch(trimmed, k);
      setResults(res.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">
          Query Your Document Index
        </h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. What are the key takeaways from the document?"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-500">
              Top {k}
              <input
                type="range"
                min={1}
                max={20}
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
                className="w-24"
              />
            </label>
            <button
              onClick={handleSearch}
              disabled={loading || !backendOnline || !query.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Searching…" : "🚀 Search"}
            </button>
          </div>
        </div>
        {!backendOnline && (
          <p className="mt-3 text-sm text-amber-600">
            Backend is offline — start the FastAPI server to search.
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {results &&
        (results.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
            No relevant matching chunks found in the vector store.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-emerald-700">
              Found {results.length} matching chunk(s).
            </p>
            {results.map((r) => {
              const meta = r.metadata ?? {};
              const page = (meta as Record<string, string | number | undefined>)
                .page;
              return (
                <div
                  key={r.id}
                  className="rounded-lg border border-slate-200 border-l-4 border-l-blue-500 bg-white p-4 shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">
                      #{r.rank} | 📄 {sourceName(meta)}
                      {page !== undefined ? ` (Page ${page})` : ""}
                    </p>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      Similarity: {r.score.toFixed(4)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                    {r.content}
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600">
                      View metadata
                    </summary>
                    <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-2 text-xs text-slate-600">
                      {JSON.stringify(meta, null, 2)}
                    </pre>
                  </details>
                </div>
              );
            })}
          </div>
        ))}
    </section>
  );
}
```

### 3.7 `app/components/UploadPanel.tsx`

```tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { uploadFile } from "../lib/api";

const ALLOWED_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "txt",
  "rtf",
  "json",
  "pptx",
  "csv",
  "md",
];


interface Props {
  backendOnline: boolean;
  onIndexed: () => void;
}

interface UploadedMessage {
  filename: string;
  chunks: number;
  total: number;
}

export default function UploadPanel({ backendOnline, onIndexed }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<UploadedMessage[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValid = useCallback((name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    return ALLOWED_EXTENSIONS.includes(ext);
  }, []);

  const addFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const valid = Array.from(list).filter((f) => isValid(f.name));
      const invalid = Array.from(list).filter((f) => !isValid(f.name));
      if (invalid.length) {
        setErrors((prev) => [
          ...prev,
          `Skipped ${invalid.length} file(s) with unsupported extension.`,
        ]);
      }
      setFiles((prev) => [...prev, ...valid]);
    },
    [isValid]
  );

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);
    setErrors([]);
    setMessages([]);
    for (const file of files) {
      try {
        const res = await uploadFile(file);
        setMessages((prev) => [
          ...prev,
          {
            filename: res.filename,
            chunks: res.chunks_created,
            total: res.total_documents_in_store,
          },
        ]);
      } catch (e) {
        setErrors((prev) => [
          ...prev,
          `${file.name}: ${e instanceof Error ? e.message : "upload failed"}`,
        ]);
      }
    }
    setUploading(false);
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
    onIndexed();
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">
          Upload & Index New Documents
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Supported: .pdf, .doc, .docx, .txt, .rtf, .json, .pptx, .csv, .md. The
          backend parses, chunks, embeds, and stores them in ChromaDB.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`mt-4 cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition ${
            dragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 bg-slate-50 hover:border-blue-400"
          }`}
        >
          <p className="text-sm font-medium text-slate-600">
            Drag & drop files here, or click to browse
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {files.length} file(s) selected
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {files.map((f) => (
              <div
                key={`${f.name}-${f.size}`}
                className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600"
              >
                <span>{f.name}</span>
                <span className="text-xs text-slate-400">
                  {(f.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ))}
            <button
              onClick={handleUpload}
              disabled={uploading || !backendOnline}
              className="mt-2 self-end rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? "Processing…" : "⚡ Process & Index Documents"}
            </button>
          </div>
        )}

        {!backendOnline && (
          <p className="mt-3 text-sm text-amber-600">
            Backend is offline — start the FastAPI server to ingest documents.
          </p>
        )}
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errors.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {messages.map((m) => (
            <p key={m.filename}>
              ✅ <strong>{m.filename}</strong>: created {m.chunks} chunk(s) —
              store now has {m.total} chunk(s).
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
```

### 3.8 `app/components/InspectorPanel.tsx`

```tsx
"use client";

import type { HealthResponse } from "../lib/types";

interface Props {
  backendOnline: boolean;
  health: HealthResponse | null;
}

export default function InspectorPanel({ backendOnline, health }: Props) {
  if (!backendOnline || !health) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Cannot inspect the vector store while the backend is offline.
      </div>
    );
  }

  const stats = [
    { label: "Total Indexed Chunks", value: health.total_documents_in_store },
    { label: "Embedding Model", value: health.model },
    { label: "API Status", value: health.status },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">
        Collection Overview
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center"
          >
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="mt-1 text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Chunk-level inspection is available via the backend Swagger UI at{" "}
        <code className="rounded bg-slate-200 px-1">
          http://localhost:8000/docs
        </code>
        .
      </p>
    </div>
  );
}
```

### 3.9 `app/page.tsx` (dashboard — replaces the placeholder)

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import BackendStatus from "./components/BackendStatus";
import SearchPanel from "./components/SearchPanel";
import UploadPanel from "./components/UploadPanel";
import InspectorPanel from "./components/InspectorPanel";
import { fetchHealth } from "./lib/api";
import type { HealthResponse } from "./lib/types";

type Tab = "search" | "upload" | "inspector";

const TABS: { id: Tab; label: string }[] = [
  { id: "search", label: "🔎 Semantic Search" },
  { id: "upload", label: "📤 Document Ingestion" },
  { id: "inspector", label: "📊 Vector Store Inspector" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("search");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(true);

  const loadHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const h = await fetchHealth();
      setHealth(h);
      setBackendOnline(true);
    } catch {
      setHealth(null);
      setBackendOnline(false);
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-800">
          🔍 RAG Production System
        </h1>
        <p className="mt-1 text-slate-500">
          Upload documents via the FastAPI backend, build vector embeddings, and
          run semantic similarity searches.
        </p>
      </header>

      <BackendStatus
        online={backendOnline}
        loading={loadingHealth}
        health={health}
        onRefresh={loadHealth}
      />

      <nav className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "search" && <SearchPanel backendOnline={backendOnline} />}
      {tab === "upload" && (
        <UploadPanel backendOnline={backendOnline} onIndexed={loadHealth} />
      )}
      {tab === "inspector" && (
        <InspectorPanel backendOnline={backendOnline} health={health} />
      )}
    </main>
  );
}
```

### 3.10 Optional: fix `layout.tsx` metadata

Replace the default metadata in `app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: "RAG Production System",
  description:
    "Upload documents, build vector embeddings, and run semantic searches against your RAG index.",
};
```

---

## 4. How to run

```bash
# Terminal 1 — backend (from backend/)
uvicorn api:app --reload --port 8000

# Terminal 2 — frontend (from frentend/)
npm run dev
# open http://localhost:3000
```

Verify: the status banner turns green, upload a `.pdf`/`.txt`/`.md`, then search for a phrase from the document and confirm ranked chunks with similarity scores appear.

---

## 5. Notes / gotchas

- **One file per `/upload` request** — the UI loops; do not send multiple files in one FormData.
- **Score semantics**: `score ≈ 1 - (distance/2)`, so `1.0` = identical, lower = less similar.
- **Proxy pattern**: client only talks to `/api/*`; the FastAPI URL stays server-side (no CORS issues, secrets safe).
- Keep `metadata` rendering defensive (`?? {}`) because fields like `original_filename` are only added at upload time.

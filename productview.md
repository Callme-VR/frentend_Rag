# RAG Production System — Demo Video Script (3 Min)

---

## 0:00 — 0:20 | Opening & Problem Statement

**[On screen: Title card — "RAG Production System"]**

> "Large Language Models are powerful, but they have a critical limitation — they can't answer questions about your private documents. RAG fixes that."

**Voiceover:**
"Meet the RAG Production System — a Retrieval-Augmented Generation platform that lets you upload your documents, build a searchable vector index, and get precise, source-backed answers in seconds."

---

## 0:20 — 0:50 | Architecture Overview

**[On screen: Architecture diagram — Browser → Next.js Frontend → FastAPI Backend → ChromaDB]**

**Voiceover:**
"The system has two parts: a FastAPI backend and a Next.js frontend."

- **Backend** handles document ingestion, chunking, embedding with `all-MiniLM-L6-v2`, and vector storage in ChromaDB.
- **Frontend** is a modern React dashboard with three tabs — Search, Upload, and Inspector.
- The frontend proxies all API calls through Next.js route handlers, so the backend URL never touches the browser.

**[On screen: Code snippet of `api.py` endpoints]**

> Three core endpoints: `GET /health`, `POST /upload`, `POST /search`

---

## 0:50 — 1:30 | Live Demo — Upload & Ingestion

**[On screen: Browser open at localhost:3000]**

**Voiceover:**
"Let's walk through a real demo. First, I open the web app."

**[Action: Show the landing page with the header 'RAG System' and the Backend Status banner]**

> "The green banner confirms the backend is online, showing the model name and current chunk count."

**[Action: Click the '📤 Document Ingestion' tab]**

**Voiceover:**
"I navigate to the Document Ingestion tab. I drag and drop a PDF — say, a research paper or a policy document."

**[Action: Drop a file onto the upload zone. Click '⚡ Process & Index Documents'. Show the success toast with chunk count.]**

> "The file is uploaded to the backend, which parses it, splits it into chunks, generates embeddings, and stores them in ChromaDB. One file, 15 chunks indexed."
---

## 1:30 — 2:15 | Live Demo — Semantic Search

**[Action: Click the '🔎 Semantic Search' tab]**

**Voiceover:**
"Now I switch to Semantic Search. I type a natural-language query — not a keyword, but a question about the document's content."

**[Action: Type 'What is the main budget allocation for Q3?' and hit Search. Show loading spinner, then results appearing.]**

> "The system returns ranked chunks with similarity scores. Each result shows the source filename, page number, and the matched content. I can expand metadata to see chunk details."

**[Action: Adjust the 'Top K' slider from 5 to 10. Run another search with a different query like 'key takeaways from the report'. Show results updating.]**

> "The slider controls how many results I get back. The higher the similarity score, the more relevant the chunk."


## 2:15 — 2:45 | Live Demo — Vector Store Inspector

**[Action: Click the '📊 Vector Store Inspector' tab]**

**Voiceover:**
"The Inspector tab gives me a bird's-eye view of what's in the vector store."

**[Action: Show the three metric cards — Total Indexed Chunks, Embedding Model, API Status]**

> "I can see the total chunk count, the embedding model in use, and the backend health status — all at a glance."

---

## 2:45 — 3:00 | Closing & Key Takeaways

**[On screen: Summary card]**

**Voiceover:**
"That's the RAG Production System in three minutes."

**[On screen: Bullet points appear one by one]**

- Upload any document — PDF, TXT, MD, DOCX, CSV, and more
- Automatic chunking, embedding, and vector indexing
- Semantic search with ranked, scored results and source attribution
- Real-time backend health monitoring and vector store inspection
- Full-stack: FastAPI backend + Next.js frontend, deployable on Vercel and Render

**[On screen: End card — "Built with FastAPI · ChromaDB · SentenceTransformer · Next.js"]**

> "Your documents, now queryable by meaning — not just by keyword."

---

## How to Run Locally

### Backend
```powershell
cd backend
uvicorn api:app --reload --port 8000
```

### Frontend
```powershell
cd frentend
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Deployment

- **Backend** → Vercel (`api:app` entrypoint)
- **Frontend** → Render (Next.js web service)
- See `deployment.md` for full step-by-step instructions.

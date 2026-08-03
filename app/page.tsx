"use client";

import { useCallback, useEffect, useState } from "react";

import BackendStatus from "@/components/Backendstatus";
import InspectorPanel from "@/components/Inspector";
import SearchPanels from "@/components/SearchPanels";
import UploadPanels from "@/components/UploadPanels";

import { fetchHealth } from "@/lib/api";

type Tab = "search" | "upload" | "inspector";

// If you already have a Health interface in your API file,
// import it instead of declaring it here.
type Health = Awaited<ReturnType<typeof fetchHealth>>;

const TABS: { id: Tab; label: string }[] = [
  { id: "search", label: "🔎 Semantic Search" },
  { id: "upload", label: "📤 Document Ingestion" },
  { id: "inspector", label: "📊 Vector Store Inspector" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("search");

  const [health, setHealth] = useState<Health | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(true);

  const loadHealth = useCallback(async () => {
    setLoadingHealth(true);

    try {
      const data = await fetchHealth();

      setHealth(data);
      setBackendOnline(true);
    } catch (error) {
      console.error("Failed to fetch backend health:", error);

      setHealth(null);
      setBackendOnline(false);
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  /* eslint-disable */
  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);
  /* eslint-enable */

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-5 py-8">
      {/* Page Header */}
      <header>
        <h1 className="text-3xl font-bold text-slate-800">
          RAG <span className="text-blue-600">System</span>
        </h1>

        <p className="mt-1 text-slate-500">
          Upload documents and run semantic similarity searches.
        </p>
      </header>

      {/* Backend Status */}
      <BackendStatus
        online={backendOnline}
        loading={loadingHealth}
        health={health}
        onRefresh={loadHealth}
      />

      {/* Navigation Tabs */}
      <nav className="flex flex-wrap gap-3 rounded-xl border border-slate-300 bg-white p-1.5 shadow-sm">
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

      {/* Tab Content */}
      {tab === "search" && (
        <SearchPanels backendOnline={backendOnline} />
      )}

      {tab === "upload" && (
        <UploadPanels
          backendOnline={backendOnline}
          onIndexed={loadHealth}
        />
      )}

      {tab === "inspector" && (
        <InspectorPanel
          backendOnline={backendOnline}
          health={health}
        />
      )}
    </main>
  );
}
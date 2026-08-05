"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import BackendStatus from "@/components/Backendstatus";
import InspectorPanel from "@/components/Inspector";
import SearchPanels from "@/components/SearchPanels";
import UploadPanels from "@/components/UploadPanels";

import { fetchHealth } from "@/lib/api";
import type { HealthResponse } from "@/lib/types";

type Tab = "search" | "upload" | "inspector";

/** Poll interval for live health / chunk count updates (ms). */
const HEALTH_POLL_MS = 15_000;

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

  /** Avoid overlapping health requests. */
  const inFlight = useRef(false);

  const loadHealth = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;

    if (inFlight.current) return;
    inFlight.current = true;

    if (!silent) {
      setLoadingHealth(true);
    }

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
      inFlight.current = false;
    }
  }, []);

  // Initial load + live polling (no full-page spinner on background polls).
  // Health is external system state; setState runs only after the async fetch resolves.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bootstrap external health check
    void loadHealth();

    const id = window.setInterval(() => {
      void loadHealth({ silent: true });
    }, HEALTH_POLL_MS);

    return () => window.clearInterval(id);
  }, [loadHealth]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-5 py-8">
      <header className="flex flex-col items-center">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          DocumentDigger<span className="text-blue-600 dark:text-blue-400">AI</span>
        </h1>
      </header>

      <BackendStatus
        online={backendOnline}
        loading={loadingHealth}
        health={health}
        onRefresh={() => void loadHealth()}
      />

      <nav className="flex flex-wrap gap-3 rounded-xl border border-slate-300 bg-white p-1.5 shadow-sm dark:border-slate-600 dark:bg-slate-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "search" && (
        <SearchPanels backendOnline={backendOnline} />
      )}

      {tab === "upload" && (
        <UploadPanels
          backendOnline={backendOnline}
          onIndexed={() => void loadHealth()}
        />
      )}

      {tab === "inspector" && (
        <InspectorPanel
          backendOnline={backendOnline}
          health={health}
          loading={loadingHealth}
          onRefresh={() => void loadHealth()}
        />
      )}
    </main>
  );
}

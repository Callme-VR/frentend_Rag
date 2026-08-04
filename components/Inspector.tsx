"use client";

import type { HealthResponse } from "@/lib/types";
import HealthDot from "@/components/HealthDot";
import ModelBadge from "@/components/ModelBadge";

interface Props {
  backendOnline: boolean;
  health: HealthResponse | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function InspectorPanel({
  backendOnline,
  health,
  loading = false,
  onRefresh,
}: Props) {
  if (loading && !health) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <span className="inline-block h-4 w-4 animate-pulse rounded-full bg-slate-300 dark:bg-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading vector store metrics…
          </p>
        </div>
      </div>
    );
  }

  if (!backendOnline || !health) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 transition-colors dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <HealthDot online={false} />
            <span>
              Cannot inspect the vector store while the backend is offline.
            </span>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:border-red-700 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-900/60"
            >
              🔄 Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const totalChunks = health.total_documents_in_store ?? 0;
  const isHealthy =
    health.status?.toLowerCase() === "healthy" ||
    health.status?.toLowerCase() === "ok";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
          Collection Overview
        </h2>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            {loading ? "Refreshing…" : "🔄 Refresh stats"}
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Indexed Chunks */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center transition-colors dark:border-slate-600 dark:bg-slate-900/40">
          <p className="text-2xl font-bold tabular-nums text-slate-800 dark:text-white">
            {totalChunks}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Total Indexed Chunks
          </p>
        </div>

        {/* Selected AI Model */}
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-center transition-colors dark:border-slate-600 dark:bg-slate-900/40">
          <ModelBadge model={health.model} />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Selected AI Model
          </p>
        </div>

        {/* Live Health Status */}
        <div
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border p-4 text-center transition-colors duration-300 ${
            isHealthy
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
              : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
          }`}
        >
          <HealthDot online={backendOnline} status={health.status} />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Live Health Status
          </p>
        </div>
      </div>

      {totalChunks === 0 ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          No data currently indexed in ChromaDB. Upload documents in the
          Document Ingestion tab first.
        </p>
      ) : (
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          Chunk-level inspection is available via the backend Swagger UI at{" "}
          <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">
            http://localhost:8000/docs
          </code>
          .
        </p>
      )}
    </div>
  );
}

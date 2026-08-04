"use client";

import { HealthResponse } from "@/lib/types";
import HealthDot from "@/components/HealthDot";
import ModelBadge from "@/components/ModelBadge";

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
  if (loading && !health) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-md transition-colors dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-3">
          <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-slate-300 dark:bg-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Checking backend health status...
          </p>
        </div>
      </div>
    );
  }

  const chunkCount = health?.total_documents_in_store ?? 0;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5 shadow-md transition-colors duration-300 ${
        online
          ? "border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20"
          : "border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              Backend
            </p>
            <HealthDot online={online} status={health?.status} />
          </div>

          {online && health ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <strong>Model:</strong>
                <ModelBadge model={health.model} size="sm" />
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>
                <strong>Indexed Chunks:</strong>{" "}
                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-100">
                  {chunkCount}
                </span>
              </span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
              Could not reach the RAG backend. Run{" "}
              <code className="rounded bg-slate-200 px-1 py-0.5 dark:bg-slate-700">
                uvicorn api:app --reload --port 8000
              </code>{" "}
              inside{" "}
              <code className="rounded bg-slate-200 px-1 py-0.5 dark:bg-slate-700">
                backend/
              </code>
              .
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
      >
        {loading ? "Refreshing…" : "🔄 Refresh"}
      </button>
    </div>
  );
}

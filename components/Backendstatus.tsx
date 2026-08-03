"use client";

import { HealthResponse } from "@/lib/types";

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
  // ===========================
  // Loading State
  // ===========================
  if (loading) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm text-slate-500">
          Checking backend health status...
        </p>
      </div>
    );
  }

  // ===========================
  // Main Component
  // ===========================
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5 shadow-md transition-colors ${
        online
          ? "border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20"
          : "border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20"
      }`}
    >
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Status Dot */}
        <span
          className={`inline-block h-3 w-3 rounded-full ${
            online ? "bg-green-500" : "bg-red-500"
          }`}
        />

        {/* Backend Information */}
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-white">
            Backend {online ? "Online" : "Offline"}
          </p>

          {online && health ? (
            <p className="text-xs text-slate-500 dark:text-slate-300">
              <strong>Status:</strong> {health.status} &nbsp;•&nbsp;
              <strong>Model:</strong> {health.model} &nbsp;•&nbsp;
              <strong>Indexed Chunks:</strong>{" "}
              {health.total_documents}
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-300">
              Could not reach the RAG backend.
              <br />
              Run{" "}
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

      {/* Right Section */}
      <button
        onClick={onRefresh}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
      >
        🔄 Refresh
      </button>
    </div>
  );
}
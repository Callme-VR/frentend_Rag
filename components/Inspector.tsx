"use client"

import type { HealthResponse } from "../lib/types";
interface Props{
     backendOnline:boolean;
     health:HealthResponse | null;
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
    { label: "Total Indexed Chunks", value: health.total_documents },
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
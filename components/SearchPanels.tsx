"use client";

import { RunSearch } from "@/lib/api";
import { SearchResultItem } from "@/lib/types";
import { useState } from "react";

interface Props {
  backendOnline: boolean;
}

/**
 * Returns the document name from metadata.
 */
function sourceName(meta: Record<string, unknown>) {
  const m = meta as Record<string, string | undefined>;

  return (
    m.original_filename ??
    m.filename ??
    m.source_file ??
    m.source ??
    "Unknown Document"
  );
}

export default function SearchPanels({ backendOnline }: Props) {
  // ==========================
  // State
  // ==========================
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [k, setK] = useState(5);

  /**
   * Executes the search request.
   */
  async function handleSearch() {
    const trimmed = query.trim();

    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const response = await RunSearch(trimmed, k);
      setResults(response.results);
    } catch (err: any) {
      setError(err.message || "An error occurred during the search.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ========================= */}
      {/* Search Panel */}
      {/* ========================= */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-700">
          Query Your Documents Index
        </h2>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          {/* Search Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="Search information from your documents..."
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <div className="flex items-center gap-4">
            {/* Top K */}
            <label
              htmlFor="k"
              className="flex items-center gap-2 text-sm font-medium text-slate-700"
            >
              Results:
              <span className="font-semibold">{k}</span>

              <input
                id="k"
                type="range"
                min={1}
                max={20}
                value={k}
                onChange={(e) => setK(Number(e.target.value))}
                className="h-2 w-24 cursor-pointer rounded-lg bg-slate-200 accent-blue-500"
              />
            </label>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={!backendOnline || loading || !query.trim()}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Searching..." : "🔍 Search"}
            </button>
          </div>
        </div>

        {/* Backend Status */}
        {!backendOnline && (
          <p className="mt-4 text-sm text-red-600">
            Backend is offline. Please start the backend server.
          </p>
        )}
      </div>

      {/* ========================= */}
      {/* Error */}
      {/* ========================= */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ========================= */}
      {/* Results */}
      {/* ========================= */}
      <section className="flex flex-col gap-4">
        {results.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-100 p-4 text-sm text-slate-600">
            No relevant matching chunks found in the vector store.
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              Found <strong>{results.length}</strong> matching chunk(s).
            </p>

            {results.map((r) => {
              const meta = (r.metadata ??
                {}) as Record<string, string | number | undefined>;

              const page = meta.page;

              return (
                <div
                  key={r.id}
                  className="rounded-lg border border-slate-200 border-l-4 border-l-blue-500 bg-white p-4 shadow-sm"
                >
                  {/* Header */}
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">
                      #{r.rank} | 📄 {sourceName(meta)}
                      {page !== undefined ? ` (Page ${page})` : ""}
                    </p>

                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      Similarity: {r.score.toFixed(4)}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                    {r.content}
                  </p>

                  {/* Metadata */}
                  <details className="mt-3">
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
          </>
        )}
      </section>
    </div>
  );
}
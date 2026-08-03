"use client";

import { useCallback, useRef, useState } from "react";
import { UploadFiles } from "../lib/api";

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

export default function UploadPanels({
  backendOnline,
  onIndexed,
}: Props) {
  // ==========================
  // declare state variables
  // ==========================
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

  const addfiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;

      const newFiles = Array.from(list).filter((f) => isValid(f.name));

      const invalidFiles = Array.from(list).filter(
        (f) => !isValid(f.name)
      );

      if (invalidFiles.length > 0) {
        setErrors((prev) => [
          ...prev,
          ...invalidFiles.map((f) => `Invalid file type: ${f.name}`),
        ]);
      }

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [isValid]
  );

  // ==========================
  // Upload files
  // ==========================
  async function handleUpload() {
    if (files.length === 0) {
      setErrors((prev) => [...prev, "No files selected for upload."]);
      return;
    }

    setUploading(true);
    setErrors([]);
    setMessages([]);

    for (const file of files) {
      try {
        const response = await UploadFiles([file]);

        setMessages((prev) => [
          ...prev,
          {
            filename: response.filename,
            chunks: response.chunks_created,
            total: response.total_documents_in_store,
          },
        ]);
      } catch (err) {
        setErrors((prev) => [
          ...prev,
          `${file.name}: ${
            err instanceof Error ? err.message : "Upload file failed."
          }`,
        ]);
      }
    }

    setUploading(false);
    setFiles([]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    onIndexed();
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-md">
        <h2 className="text-lg font-semibold text-slate-800">
          Upload & index new Documents
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Supported: .pdf, .doc, .docx, .txt, .rtf, .json, .pptx, .csv, .md.
          The backend parses, chunks, embeds, and stores them in ChromaDB.
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
            addfiles(e.dataTransfer.files);
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
            onChange={(e) => addfiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
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
              {uploading
                ? "Processing..."
                : "⚡ Process & Index Documents"}
            </button>
          </div>
        )}

        {!backendOnline && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Backend is offline. Please start the backend before uploading.
          </div>
        )}

        {errors.length > 0 && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        {messages.length > 0 && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {messages.map((m) => (
              <p key={m.filename}>
                ✅ <strong>{m.filename}</strong>: created {m.chunks} chunk(s) —
                store now has {m.total} chunk(s).
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
import { RAG_API_URL } from "@/lib/config";

export async function GET() {
  try {
    const response = await fetch(`${RAG_API_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    const data = await response.json();
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json(
      {
        status: "offline",
        model: "",
        total_documents_in_store: 0,
        error: "Backend unreachable",
      },
      { status: 503 }
    );
  }
}

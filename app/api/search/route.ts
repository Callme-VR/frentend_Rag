import { RAG_API_URL } from "@/lib/config";

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(`${RAG_API_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
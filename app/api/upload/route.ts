import { RAG_API_URL } from "@/lib/config";

export async function POST(request: Request) {
  const formData = await request.formData();
  const res = await fetch(`${RAG_API_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}

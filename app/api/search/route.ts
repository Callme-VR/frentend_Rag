import { RAG_API_URL } from "@/lib/config";

export async function POST(request:Request){
    const body=await request.formData();
    const reponse=await fetch(`${RAG_API_URL}/search`,{
        method:"POST",
        body:body
    });
    const data=await reponse.json();
    return Response.json(data,{
        status:reponse.status,
    });
}
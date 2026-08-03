import {RAG_API_URL} from "@/lib/config";

export async function GET(){
    const reponse=await fetch(`${RAG_API_URL}/health`,{
        cache:"no-store",
    });
    const data=await reponse.json();
    return Response.json(data,{
        status:reponse.status,
    });
}




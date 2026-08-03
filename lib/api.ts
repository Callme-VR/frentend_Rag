import axios from "axios";
import type{
    HealthResponse,
    SearchResultItem,
    SearchResponse,
    SearchRequest,
    UploadResponse
} from "./types";


const https=axios.create({
    timeout:60_000,
})


export  async function Fetchhealth():Promise<HealthResponse>{
    const response = await https.get<HealthResponse>("/api/health");
    return response.data;
}


export  async function RunSearch(query:string,n_results:number):Promise<SearchResponse>{
    const requestfromSearch=await https.post<SearchResponse>("api/search",{query,n_results});
    return requestfromSearch.data;
}

export async function UploadFiles(files:File[]):Promise<UploadResponse>{
    const formData=new FormData();

    formData.append("file",files[0]);
    const reponse=await https.post<UploadResponse>("api//upload",formData,{});
    return reponse.data;
}
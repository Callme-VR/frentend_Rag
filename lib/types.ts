export interface HealthResponse{
    status:string,
    model:string,
    total_documents:number,
}

export interface SearchResultItem{
    rank:number,
    score:number,
    content:string,
    metadata:Record<string,string>
    id:string,
}

export interface SearchResponse{
    query:string,
    total_results:number,
    results:SearchResultItem[];
}

export interface SearchRequest{
    query:string,
    n_results:number
}

export interface UploadResponse{
    status:string,
    filename:string,
    saved_paths:string,
    chunks_created:number,
    total_documents_in_store:number,
}
export interface HealthResponse {
  status: string;
  model: string;
  /** Total indexed chunks in the ChromaDB collection. */
  total_documents_in_store: number;
}

export interface SearchResultItem {
  rank: number;
  score: number;
  content: string;
  metadata: Record<string, unknown>;
  id: string;
}

export interface SearchResponse {
  query: string;
  total_results: number;
  results: SearchResultItem[];
}

export interface SearchRequest {
  query: string;
  n_results: number;
}

export interface UploadResponse {
  status: string;
  filename: string;
  saved_path: string;
  chunks_created: number;
  total_documents_in_store: number;
}

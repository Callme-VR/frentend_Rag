import axios from "axios";
import type {
  HealthResponse,
  SearchResponse,
  UploadResponse,
} from "./types";

const http = axios.create({
  timeout: 60_000,
});

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await http.get<HealthResponse>("/api/health");
  return response.data;
}

export async function RunSearch(
  query: string,
  n_results: number
): Promise<SearchResponse> {
  const response = await http.post<SearchResponse>("/api/search", {
    query,
    n_results,
  });
  return response.data;
}

export async function UploadFiles(files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", files[0]);
  const response = await http.post<UploadResponse>("/api/upload", formData);
  return response.data;
}

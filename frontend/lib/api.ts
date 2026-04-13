import axios from "axios";
import type { RecommendRequest, RecommendResponse } from "@/types/api";

const client = axios.create({ baseURL: "" });

export async function getRecommendation(
  payload: RecommendRequest
): Promise<RecommendResponse> {
  const { data } = await client.post<RecommendResponse>(
    "/api/recommend",
    payload
  );
  return data;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const { data } = await client.get("/api/health");
    return data.status === "ok";
  } catch {
    return false;
  }
}

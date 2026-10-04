import axios, { type AxiosRequestConfig } from "axios";
import { AUTH_STORAGE_KEY } from "./constants";
import type { AuthUser } from "@/types/common";

const baseURL = (import.meta.env["VITE_API_URL"] as string | undefined) || "http://localhost:8081";

/**
 * Shared HTTP client communicating with Spring Boot CCMS backend.
 * Automatically injects X-Actor-Id and X-Actor-Role headers for open actor context.
 */
export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  try {
    if (typeof window !== "undefined") {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const user = JSON.parse(raw) as AuthUser;
        if (user.id) {
          config.headers["X-Actor-Id"] = user.id;
        } else if (user.name) {
          config.headers["X-Actor-Id"] = user.name;
        }
        if (user.role) {
          config.headers["X-Actor-Role"] = user.role;
        }
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return config;
});

export interface ApiResponseEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

/**
 * Helper to unwrap standard backend ApiResponse<T> payloads
 */
export async function apiFetch<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await api.request<ApiResponseEnvelope<T> | T>(config);
  const body = response.data;
  if (body && typeof body === "object" && "data" in body && "success" in body) {
    return (body as ApiResponseEnvelope<T>).data;
  }
  return body as T;
}

export const apiClient = {
  get: <T>(url: string, params?: Record<string, unknown>, config?: Partial<AxiosRequestConfig>) =>
    apiFetch<T>({ method: "GET", url, params, ...config }),

  post: <T>(url: string, data?: unknown, config?: Partial<AxiosRequestConfig>) =>
    apiFetch<T>({ method: "POST", url, data, ...config }),

  put: <T>(url: string, data?: unknown, config?: Partial<AxiosRequestConfig>) =>
    apiFetch<T>({ method: "PUT", url, data, ...config }),

  patch: <T>(url: string, data?: unknown, config?: Partial<AxiosRequestConfig>) =>
    apiFetch<T>({ method: "PATCH", url, data, ...config }),

  delete: <T>(url: string, config?: Partial<AxiosRequestConfig>) =>
    apiFetch<T>({ method: "DELETE", url, ...config }),
};

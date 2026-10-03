import axios from "axios";

/** Shared HTTP client for the small live booking surface. */
export const api = axios.create({
  baseURL: (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:8081",
  withCredentials: true,
});

import axios from "axios";

/** Shared HTTP client. Base URL comes from env only; no calls are made yet. */
export const api = axios.create({
  baseURL: (import.meta.env["VITE_API_URL"] as string | undefined) ?? "",
  withCredentials: true,
});

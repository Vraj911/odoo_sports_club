export const API_URL = import.meta.env["VITE_API_URL"] as string | undefined;
export const UNSPLASH_BASE_URL = import.meta.env["VITE_UNSPLASH_BASE_URL"] as string | undefined;
export const GOOGLE_FONTS_ORIGIN = import.meta.env["VITE_GOOGLE_FONTS_ORIGIN"] as string | undefined;
export const GOOGLE_FONTS_STATIC_ORIGIN = import.meta.env["VITE_GOOGLE_FONTS_STATIC_ORIGIN"] as string | undefined;
export const GOOGLE_FONTS_URL = import.meta.env["VITE_GOOGLE_FONTS_URL"] as string | undefined;

export function unsplashUrl(photoId: string): string {
  const base = UNSPLASH_BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/photo-${photoId}?w=150&auto=format&fit=crop&q=80`;
}

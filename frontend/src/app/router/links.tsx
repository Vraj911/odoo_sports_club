import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";

function parseTo(to: string) {
  if (to === "/") return { path: "", search: undefined };
  const [rawPath, rawSearch] = to.replace(/^\//, "").split("?");
  const search: Record<string, string> = {};
  if (rawSearch) {
    new URLSearchParams(rawSearch).forEach((val, key) => {
      search[key] = val;
    });
  }
  return {
    path: rawPath || "",
    search: rawSearch ? search : undefined,
  };
}

/** Link to any configured path ("/app/book"). All non-root paths resolve through the catch-all route. */
export function AppLink({ to, ...rest }: { to: string } & Omit<ComponentProps<"a">, "href" | "ref">) {
  const props = rest as object;
  if (to === "/") return <Link to="/" {...props} />;
  const { path, search } = parseTo(to);
  return (
    <Link
      to="/$"
      params={{ _splat: path }}
      {...(search ? { search } : {})}
      {...props}
    />
  );
}

export function GoTo({ to }: { to: string }) {
  if (to === "/") return <Navigate to="/" replace />;
  const { path, search } = parseTo(to);
  return (
    <Navigate
      to="/$"
      params={{ _splat: path }}
      {...(search ? { search } : {})}
      replace
    />
  );
}

export function useGo() {
  const navigate = useNavigate();
  return (to: string) => {
    if (to === "/") return navigate({ to: "/" });
    const { path, search } = parseTo(to);
    return navigate({
      to: "/$",
      params: { _splat: path },
      ...(search ? { search } : {}),
    });
  };
}

export const useAppNavigate = useGo;


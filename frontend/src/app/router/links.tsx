import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import type { ComponentProps } from "react";

/** Link to any configured path ("/app/book"). All non-root paths resolve through the catch-all route. */
export function AppLink({ to, ...rest }: { to: string } & Omit<ComponentProps<"a">, "href" | "ref">) {
  const props = rest as object;
  if (to === "/") return <Link to="/" {...props} />;
  return <Link to="/$" params={{ _splat: to.replace(/^\//, "") }} {...props} />;
}

export function GoTo({ to }: { to: string }) {
  if (to === "/") return <Navigate to="/" replace />;
  return <Navigate to="/$" params={{ _splat: to.replace(/^\//, "") }} replace />;
}

export function useGo() {
  const navigate = useNavigate();
  return (to: string) =>
    to === "/"
      ? navigate({ to: "/" })
      : navigate({ to: "/$", params: { _splat: to.replace(/^\//, "") } });
}

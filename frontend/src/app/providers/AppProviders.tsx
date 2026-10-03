import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";

/** Query + Auth + Motion. The router itself is provided by TanStack Start. */
export function AppProviders({ queryClient, children }: { queryClient: QueryClient; children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <AuthProvider>{children}</AuthProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}

import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { matchRoute } from "./routeConfig";
import { RequireAuth } from "./guards/RequireAuth";
import { RequireAccess } from "./guards/RequireRole";
import { RoleHomeRedirect } from "./guards/RoleHomeRedirect";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { MemberLayout } from "@/components/layout/MemberLayout";
import { ConsoleLayout } from "@/components/layout/ConsoleLayout";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import NotFound from "@/pages/NotFound";
import Forbidden from "@/pages/Forbidden";
import type { LayoutKind, PageProps, RouteMeta } from "@/types/common";

const LAYOUTS: Record<LayoutKind, ComponentType<{ route: RouteMeta; children: React.ReactNode }>> = {
  public: PublicLayout,
  auth: AuthLayout,
  member: MemberLayout,
  console: ConsoleLayout,
};

const defaultLoad = () => import("@/components/shared/PagePlaceholder");
const lazyCache = new Map<string, LazyExoticComponent<ComponentType<PageProps>>>();
function getPage(route: RouteMeta) {
  let Page = lazyCache.get(route.path);
  if (!Page) {
    Page = lazy(route.load ?? defaultLoad);
    lazyCache.set(route.path, Page);
  }
  return Page;
}

function Transition({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/** Resolves a pathname against routeConfig and renders guards + layout + lazy page. */
export function RouteRenderer({ pathname }: { pathname: string }) {
  if (pathname === "/403") return <PublicLayout route={FORBIDDEN}><Forbidden /></PublicLayout>;
  const match = matchRoute(pathname);
  if (!match) return <PublicLayout route={NOT_FOUND}><NotFound /></PublicLayout>;

  const { route, params } = match;
  const Page = getPage(route);
  const Layout = LAYOUTS[route.layout];
  const page = (
    <Layout route={route}>
      <Transition id={pathname}>
        <Suspense fallback={<PageSkeleton />}>
          <Page route={route} params={params} />
        </Suspense>
      </Transition>
    </Layout>
  );

  if (route.layout === "auth") return <RoleHomeRedirect>{page}</RoleHomeRedirect>;
  if (route.access.length === 0) return page;
  return (
    <RequireAuth>
      <RequireAccess access={route.access}>{page}</RequireAccess>
    </RequireAuth>
  );
}

const NOT_FOUND = { path: "*", title: "Out of bounds", layout: "public", access: [], phase: 1, srsIds: [] } as unknown as RouteMeta;
const FORBIDDEN = { ...NOT_FOUND, path: "/403", title: "Forbidden" } as RouteMeta;

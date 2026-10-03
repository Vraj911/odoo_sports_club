import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, render, waitFor, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routeTree.gen";

async function renderAt(path: string) {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await act(async () => {
    await router.load();
  });
  return render(<RouterProvider router={router} />);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("App routing", () => {
  it("renders the index route", async () => {
    const { container } = await renderAt("/");

    await waitFor(() => expect(container.firstChild).not.toBeNull());
  });

  it("renders the not-found route", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const { container } = await renderAt("/this-route-does-not-exist");

    await waitFor(() => expect(container.firstChild).not.toBeNull());
  });

  it("renders /availability route", async () => {
    const { container } = await renderAt("/availability");
    await waitFor(() => expect(container.firstChild).not.toBeNull());
  });

  it("handles /app/book navigation without crashing", async () => {
    const { container } = await renderAt("/app/book");
    await waitFor(() => expect(container.firstChild).not.toBeNull());
  });

  it("renders /app/book when logged in as MEMBER", async () => {
    sessionStorage.setItem(
      "ccms_auth_user",
      JSON.stringify({ id: "m-1", name: "Rahul Sharma", role: "MEMBER", groups: [] })
    );
    const { container } = await renderAt("/app/book");
    await waitFor(() => expect(container.firstChild).not.toBeNull());
  });

  it("renders /crm/leads when logged in as STAFF with CRM", async () => {
    sessionStorage.setItem(
      "ccms_auth_user",
      JSON.stringify({ id: "s-1", name: "Staff Member", role: "STAFF", groups: ["CRM"] })
    );
    const { container } = await renderAt("/crm/leads");
    await waitFor(() => expect(container.firstChild).not.toBeNull());
  });

  it("renders /admin/audit-log when logged in as ADMIN", async () => {
    sessionStorage.setItem(
      "ccms_auth_user",
      JSON.stringify({ id: "a-1", name: "Admin User", role: "ADMIN", groups: [] })
    );
    const { container } = await renderAt("/admin/audit-log");
    await waitFor(() => expect(container.firstChild).not.toBeNull());
  });
});

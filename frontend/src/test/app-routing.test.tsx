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
});

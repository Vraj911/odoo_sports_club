import { createFileRoute } from "@tanstack/react-router";
import { RouteRenderer } from "@/app/router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "bookmycourt · The Champions Club" },
      { name: "description", content: "Book courts, manage membership and more at The Champions Club." },
      { property: "og:title", content: "bookmycourt · The Champions Club" },
      { property: "og:description", content: "Book courts, manage membership and more at The Champions Club." },
    ],
  }),
  component: () => <RouteRenderer pathname="/" />,
});

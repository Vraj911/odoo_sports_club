import { createFileRoute } from "@tanstack/react-router";
import { RouteRenderer } from "@/app/router";
import { matchRoute } from "@/app/router/routeConfig";

export const Route = createFileRoute("/$")({
  head: ({ params }) => {
    const m = matchRoute("/" + (params._splat ?? ""));
    const title = `${m ? m.route.title : "Out of bounds"} · bookmycourt`;
    const description = "The Champions Club management system by bookmycourt.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: Splat,
});

function Splat() {
  const { _splat } = Route.useParams();
  return <RouteRenderer pathname={"/" + (_splat ?? "")} />;
}

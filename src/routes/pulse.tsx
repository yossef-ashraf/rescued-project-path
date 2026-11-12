import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/operations/pages/overview/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/pulse")({
  head: () => ({
    meta: [
      { title: "Pulse — Orbit" },
      { name: "description", content: "Live overview of balances, streams and workspace activity." },
      { property: "og:title", content: "Pulse — Orbit" },
      { property: "og:description", content: "Live overview of balances, streams and workspace activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

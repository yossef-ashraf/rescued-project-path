import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/operations/pages/overview/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse — Orbit" },
      { name: "description", content: "Financial pulse and workspace overview across treasury, tasks and learning." },
      { property: "og:title", content: "Pulse — Orbit" },
      { property: "og:description", content: "Financial pulse and workspace overview across treasury, tasks and learning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

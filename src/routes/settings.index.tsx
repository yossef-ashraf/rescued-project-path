import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/settings/pages/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Settings — Orbit" },
      { name: "description", content: "Workspace settings and integrations." },
      { property: "og:title", content: "Settings — Orbit" },
      { property: "og:description", content: "Workspace settings and integrations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

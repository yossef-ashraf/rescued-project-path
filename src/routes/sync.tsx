import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/operations/pages/sync/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/sync")({
  head: () => ({
    meta: [
      { title: "Sync — Orbit" },
      { name: "description", content: "Sync and integration settings." },
      { property: "og:title", content: "Sync — Orbit" },
      { property: "og:description", content: "Sync and integration settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

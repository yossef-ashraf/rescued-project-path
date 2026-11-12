import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/operations/pages/dock/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/dock")({
  head: () => ({
    meta: [
      { title: "Dock — Orbit" },
      { name: "description", content: "Dock preview scene." },
      { property: "og:title", content: "Dock — Orbit" },
      { property: "og:description", content: "Dock preview scene." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/operations/pages/export/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/export")({
  head: () => ({
    meta: [
      { title: "Export Hub — Orbit" },
      { name: "description", content: "Export workspace data to spreadsheets and documents." },
      { property: "og:title", content: "Export Hub — Orbit" },
      { property: "og:description", content: "Export workspace data to spreadsheets and documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

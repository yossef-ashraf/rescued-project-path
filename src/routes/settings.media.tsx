import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/settings/pages/media/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/settings/media")({
  head: () => ({
    meta: [
      { title: "Media — Orbit" },
      { name: "description", content: "Uploaded media library." },
      { property: "og:title", content: "Media — Orbit" },
      { property: "og:description", content: "Uploaded media library." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

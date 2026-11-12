import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/settings/pages/drive-media/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/settings/drive-media")({
  head: () => ({
    meta: [
      { title: "Drive Media — Orbit" },
      { name: "description", content: "Media stored in Google Drive." },
      { property: "og:title", content: "Drive Media — Orbit" },
      { property: "og:description", content: "Media stored in Google Drive." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

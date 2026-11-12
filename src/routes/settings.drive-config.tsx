import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/settings/pages/drive-config/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/settings/drive-config")({
  head: () => ({
    meta: [
      { title: "Drive Config — Orbit" },
      { name: "description", content: "Google Drive connection." },
      { property: "og:title", content: "Drive Config — Orbit" },
      { property: "og:description", content: "Google Drive connection." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

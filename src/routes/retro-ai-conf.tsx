import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/operations/pages/retro-ai-conf/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/retro-ai-conf")({
  head: () => ({
    meta: [
      { title: "Retro AI Config — Orbit" },
      { name: "description", content: "Retro AI configuration." },
      { property: "og:title", content: "Retro AI Config — Orbit" },
      { property: "og:description", content: "Retro AI configuration." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

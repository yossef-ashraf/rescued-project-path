import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/treasury/pages/credits/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/streams")({
  head: () => ({
    meta: [
      { title: "Streams — Orbit" },
      { name: "description", content: "Income streams and credits tracker." },
      { property: "og:title", content: "Streams — Orbit" },
      { property: "og:description", content: "Income streams and credits tracker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

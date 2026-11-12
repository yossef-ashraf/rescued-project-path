import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/sharing/pages/share/[token]/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/share/$token")({
  head: () => ({
    meta: [
      { title: "Shared item — Orbit" },
      { name: "description", content: "A shared Orbit item." },
      { property: "og:title", content: "Shared item — Orbit" },
      { property: "og:description", content: "A shared Orbit item." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

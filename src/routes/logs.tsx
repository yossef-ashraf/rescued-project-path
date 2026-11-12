import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/operations/pages/logs/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/logs")({
  head: () => ({
    meta: [
      { title: "System Logs — Orbit" },
      { name: "description", content: "Sign-in history and system activity logs." },
      { property: "og:title", content: "System Logs — Orbit" },
      { property: "og:description", content: "Sign-in history and system activity logs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

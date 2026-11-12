import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/treasury/pages/months/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline — Orbit" },
      { name: "description", content: "Monthly treasury breakdown of income and expenses." },
      { property: "og:title", content: "Timeline — Orbit" },
      { property: "og:description", content: "Monthly treasury breakdown of income and expenses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

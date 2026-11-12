import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/treasury/pages/financial-reports/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/intelligence")({
  head: () => ({
    meta: [
      { title: "Intelligence — Orbit" },
      { name: "description", content: "Financial reports and analytics." },
      { property: "og:title", content: "Intelligence — Orbit" },
      { property: "og:description", content: "Financial reports and analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/treasury/pages/debts/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Orbit" },
      { name: "description", content: "Debts and obligations tracker." },
      { property: "og:title", content: "Terms — Orbit" },
      { property: "og:description", content: "Debts and obligations tracker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

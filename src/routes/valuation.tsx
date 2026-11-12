import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/treasury/pages/prices/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/valuation")({
  head: () => ({
    meta: [
      { title: "Valuation — Orbit" },
      { name: "description", content: "Market price index for gold and currencies." },
      { property: "og:title", content: "Valuation — Orbit" },
      { property: "og:description", content: "Market price index for gold and currencies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

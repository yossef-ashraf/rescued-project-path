import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/treasury/pages/gold/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/reserves")({
  head: () => ({
    meta: [
      { title: "Reserves — Orbit" },
      { name: "description", content: "Gold, savings and zakat calculator." },
      { property: "og:title", content: "Reserves — Orbit" },
      { property: "og:description", content: "Gold, savings and zakat calculator." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/profile/pages/portfolio/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/profile/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Orbit" },
      { name: "description", content: "Portfolio projects." },
      { property: "og:title", content: "Portfolio — Orbit" },
      { property: "og:description", content: "Portfolio projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

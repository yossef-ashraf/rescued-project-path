import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/profile/pages/portfolio/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Orbit" },
      { name: "description", content: "Projects list and details." },
      { property: "og:title", content: "Projects — Orbit" },
      { property: "og:description", content: "Projects list and details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

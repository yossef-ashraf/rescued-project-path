import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/learning/pages/courses/materials/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/courses/materials/")({
  head: () => ({
    meta: [
      { title: "Materials — Orbit" },
      { name: "description", content: "Knowledge library of materials, summaries and tools." },
      { property: "og:title", content: "Materials — Orbit" },
      { property: "og:description", content: "Knowledge library of materials, summaries and tools." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

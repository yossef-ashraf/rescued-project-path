import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/learning/pages/courses/materials/[id]/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/courses/materials/$id/")({
  head: () => ({
    meta: [
      { title: "Material — Orbit" },
      { name: "description", content: "Material workspace." },
      { property: "og:title", content: "Material — Orbit" },
      { property: "og:description", content: "Material workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/learning/pages/courses/[id]/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/courses/$id/")({
  head: () => ({
    meta: [
      { title: "Course — Orbit" },
      { name: "description", content: "Course workspace." },
      { property: "og:title", content: "Course — Orbit" },
      { property: "og:description", content: "Course workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

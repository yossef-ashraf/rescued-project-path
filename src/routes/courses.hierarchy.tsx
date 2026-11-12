import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/learning/pages/courses/hierarchy/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/courses/hierarchy")({
  head: () => ({
    meta: [
      { title: "Course Hierarchy — Orbit" },
      { name: "description", content: "Course tree, categories and lessons." },
      { property: "og:title", content: "Course Hierarchy — Orbit" },
      { property: "og:description", content: "Course tree, categories and lessons." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

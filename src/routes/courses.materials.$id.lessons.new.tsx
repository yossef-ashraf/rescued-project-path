import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/learning/pages/courses/materials/[id]/lessons/new/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/courses/materials/$id/lessons/new")({
  head: () => ({
    meta: [
      { title: "New Lesson — Orbit" },
      { name: "description", content: "Create a lesson for this material." },
      { property: "og:title", content: "New Lesson — Orbit" },
      { property: "og:description", content: "Create a lesson for this material." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

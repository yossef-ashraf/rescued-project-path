import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/learning/pages/courses/materials/[id]/lessons/[lessonId]/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/courses/materials/$id/lessons/$lessonId")({
  head: () => ({
    meta: [
      { title: "Lesson — Orbit" },
      { name: "description", content: "Lesson workspace." },
      { property: "og:title", content: "Lesson — Orbit" },
      { property: "og:description", content: "Lesson workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

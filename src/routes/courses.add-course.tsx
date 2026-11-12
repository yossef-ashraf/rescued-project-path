import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/learning/pages/courses/add-course/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/courses/add-course")({
  head: () => ({
    meta: [
      { title: "Add Course — Orbit" },
      { name: "description", content: "Create a new course." },
      { property: "og:title", content: "Add Course — Orbit" },
      { property: "og:description", content: "Create a new course." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

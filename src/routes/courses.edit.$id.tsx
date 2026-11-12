import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/learning/pages/courses/edit/[id]/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/courses/edit/$id")({
  head: () => ({
    meta: [
      { title: "Edit Course — Orbit" },
      { name: "description", content: "Edit course details." },
      { property: "og:title", content: "Edit Course — Orbit" },
      { property: "og:description", content: "Edit course details." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

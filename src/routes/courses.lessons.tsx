import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/learning/pages/courses/lessons/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/courses/lessons")({
  head: () => ({
    meta: [
      { title: "All Lectures — Orbit" },
      { name: "description", content: "Index of every lecture across courses." },
      { property: "og:title", content: "All Lectures — Orbit" },
      { property: "og:description", content: "Index of every lecture across courses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

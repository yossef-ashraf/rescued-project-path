import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/learning/pages/courses/overview/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/courses/overview")({
  head: () => ({
    meta: [
      { title: "Learning Overview — Orbit" },
      { name: "description", content: "Courses progress overview." },
      { property: "og:title", content: "Learning Overview — Orbit" },
      { property: "og:description", content: "Courses progress overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/learning/pages/courses/add-category/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/courses/add-category")({
  head: () => ({
    meta: [
      { title: "Add Category — Orbit" },
      { name: "description", content: "Create a new learning category." },
      { property: "og:title", content: "Add Category — Orbit" },
      { property: "og:description", content: "Create a new learning category." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/tasks/pages/project-tasks/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/project-tasks")({
  head: () => ({
    meta: [
      { title: "Project Tasks — Orbit" },
      { name: "description", content: "Tasks grouped by project." },
      { property: "og:title", content: "Project Tasks — Orbit" },
      { property: "og:description", content: "Tasks grouped by project." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

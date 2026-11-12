import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/tasks/pages/overview/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/tasks/overview")({
  head: () => ({
    meta: [
      { title: "Tasks Overview — Orbit" },
      { name: "description", content: "Overview of tasks, progress and workload." },
      { property: "og:title", content: "Tasks Overview — Orbit" },
      { property: "og:description", content: "Overview of tasks, progress and workload." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

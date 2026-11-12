import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/tasks/pages/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/tasks/")({
  head: () => ({
    meta: [
      { title: "Tasks — Orbit" },
      { name: "description", content: "Task board with priorities, due dates and comments." },
      { property: "og:title", content: "Tasks — Orbit" },
      { property: "og:description", content: "Task board with priorities, due dates and comments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

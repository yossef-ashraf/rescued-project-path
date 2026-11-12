import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/tasks/pages/todo/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/tasks/todo")({
  head: () => ({
    meta: [
      { title: "To-Do — Orbit" },
      { name: "description", content: "Daily to-dos, habits and reminders." },
      { property: "og:title", content: "To-Do — Orbit" },
      { property: "og:description", content: "Daily to-dos, habits and reminders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

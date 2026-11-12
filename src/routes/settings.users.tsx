import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/settings/pages/users/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/settings/users")({
  head: () => ({
    meta: [
      { title: "Users — Orbit" },
      { name: "description", content: "Workspace users and roles." },
      { property: "og:title", content: "Users — Orbit" },
      { property: "og:description", content: "Workspace users and roles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/operations/pages/leads/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Leads — Orbit" },
      { name: "description", content: "Manage portfolio leads, comments and attachments." },
      { property: "og:title", content: "Leads — Orbit" },
      { property: "og:description", content: "Manage portfolio leads, comments and attachments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/settings/pages/automation/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/settings/automation")({
  head: () => ({
    meta: [
      { title: "Automation — Orbit" },
      { name: "description", content: "Reminders, Telegram and backup automation." },
      { property: "og:title", content: "Automation — Orbit" },
      { property: "og:description", content: "Reminders, Telegram and backup automation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

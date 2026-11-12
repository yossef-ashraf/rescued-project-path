import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/profile/pages/experience/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/profile/experience")({
  head: () => ({
    meta: [
      { title: "Profile · Experience — Orbit" },
      { name: "description", content: "Work experience." },
      { property: "og:title", content: "Profile · Experience — Orbit" },
      { property: "og:description", content: "Work experience." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

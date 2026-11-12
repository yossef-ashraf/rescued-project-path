import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/profile/pages/projects/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/profile/projects")({
  head: () => ({
    meta: [
      { title: "Profile · Projects — Orbit" },
      { name: "description", content: "Profile projects." },
      { property: "og:title", content: "Profile · Projects — Orbit" },
      { property: "og:description", content: "Profile projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

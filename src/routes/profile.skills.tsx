import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/profile/pages/skills/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/profile/skills")({
  head: () => ({
    meta: [
      { title: "Profile · Skills — Orbit" },
      { name: "description", content: "Skills and highlights." },
      { property: "og:title", content: "Profile · Skills — Orbit" },
      { property: "og:description", content: "Skills and highlights." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

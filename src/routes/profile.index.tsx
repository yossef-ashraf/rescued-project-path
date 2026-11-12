import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/profile/pages/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/profile/")({
  head: () => ({
    meta: [
      { title: "Profile — Orbit" },
      { name: "description", content: "Professional profile dashboard." },
      { property: "og:title", content: "Profile — Orbit" },
      { property: "og:description", content: "Professional profile dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

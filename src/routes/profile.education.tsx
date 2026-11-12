import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/profile/pages/education/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/profile/education")({
  head: () => ({
    meta: [
      { title: "Profile · Education — Orbit" },
      { name: "description", content: "Education and certificates." },
      { property: "og:title", content: "Profile · Education — Orbit" },
      { property: "og:description", content: "Education and certificates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/profile/pages/about/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/profile/about")({
  head: () => ({
    meta: [
      { title: "Profile · About — Orbit" },
      { name: "description", content: "About section of the profile." },
      { property: "og:title", content: "Profile · About — Orbit" },
      { property: "og:description", content: "About section of the profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

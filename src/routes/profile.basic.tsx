import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/profile/pages/basic/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/profile/basic")({
  head: () => ({
    meta: [
      { title: "Profile · Basics — Orbit" },
      { name: "description", content: "Personal information." },
      { property: "og:title", content: "Profile · Basics — Orbit" },
      { property: "og:description", content: "Personal information." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

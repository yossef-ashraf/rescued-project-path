import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/auth/pages/login/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Orbit" },
      { name: "description", content: "Sign in to your Orbit workspace." },
      { property: "og:title", content: "Sign in — Orbit" },
      { property: "og:description", content: "Sign in to your Orbit workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

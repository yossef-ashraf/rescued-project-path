import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/settings/pages/passwords/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/settings/passwords")({
  head: () => ({
    meta: [
      { title: "Password Vault — Orbit" },
      { name: "description", content: "Encrypted password vault." },
      { property: "og:title", content: "Password Vault — Orbit" },
      { property: "og:description", content: "Encrypted password vault." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

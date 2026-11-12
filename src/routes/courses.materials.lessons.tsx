import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/learning/pages/courses/materials/lessons/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/courses/materials/lessons")({
  head: () => ({
    meta: [
      { title: "Material Lectures — Orbit" },
      { name: "description", content: "Lectures across all materials." },
      { property: "og:title", content: "Material Lectures — Orbit" },
      { property: "og:description", content: "Lectures across all materials." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

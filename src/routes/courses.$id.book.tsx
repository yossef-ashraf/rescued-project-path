import { createFileRoute } from "@tanstack/react-router";
import Page from "@/features/learning/pages/courses/[id]/book/page.jsx";
import { NextPage } from "@/shared/next-compat/page";

export const Route = createFileRoute("/courses/$id/book")({
  head: () => ({
    meta: [
      { title: "Course Book — Orbit" },
      { name: "description", content: "Printable course book edition." },
      { property: "og:title", content: "Course Book — Orbit" },
      { property: "og:description", content: "Printable course book edition." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <NextPage component={Page} />,
});

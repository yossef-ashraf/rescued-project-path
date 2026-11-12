import { createFileRoute } from "@tanstack/react-router";
import ResetPasswordView from "@/features/auth/components/ResetPasswordView.jsx";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Orbit" },
      { name: "description", content: "Choose a new password for your Orbit account." },
      { property: "og:title", content: "Reset password — Orbit" },
      { property: "og:description", content: "Choose a new password for your Orbit account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordView,
});

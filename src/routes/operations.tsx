import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy address kept from the original app.
export const Route = createFileRoute("/operations")({
  beforeLoad: () => {
    throw redirect({ href: "/tasks/overview" });
  },
});

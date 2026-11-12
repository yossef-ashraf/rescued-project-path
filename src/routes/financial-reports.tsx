import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy address kept from the original app.
export const Route = createFileRoute("/financial-reports")({
  beforeLoad: () => {
    throw redirect({ href: "/Intelligence" });
  },
});

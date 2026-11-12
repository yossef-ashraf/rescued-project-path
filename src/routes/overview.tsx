import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy address kept from the original app.
export const Route = createFileRoute("/overview")({
  beforeLoad: () => {
    throw redirect({ href: "/Pulse" });
  },
});

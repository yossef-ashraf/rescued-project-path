import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy address kept from the original app.
export const Route = createFileRoute("/gold")({
  beforeLoad: () => {
    throw redirect({ href: "/Reserves" });
  },
});

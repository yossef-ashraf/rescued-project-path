import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy address kept from the original app.
export const Route = createFileRoute("/courses/")({
  beforeLoad: () => {
    throw redirect({ href: "/courses/hierarchy" });
  },
});

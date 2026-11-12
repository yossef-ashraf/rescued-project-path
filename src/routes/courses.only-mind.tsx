import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy address kept from the original app.
export const Route = createFileRoute("/courses/only-mind")({
  beforeLoad: () => {
    throw redirect({ href: "/courses/materials?type=onlymind" });
  },
});

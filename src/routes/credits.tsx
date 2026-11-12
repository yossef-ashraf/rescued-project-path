import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy address kept from the original app.
export const Route = createFileRoute("/credits")({
  beforeLoad: () => {
    throw redirect({ href: "/Streams" });
  },
});

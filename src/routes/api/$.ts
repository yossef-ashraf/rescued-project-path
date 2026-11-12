import { createFileRoute } from "@tanstack/react-router";

// Every /api/* call from the app goes through the original API dispatcher.
// The caller's Lovable Cloud session is verified inside handleAuthenticatedApi.
async function handle({ request }: { request: Request }) {
  const { handleAuthenticatedApi } = await import("@/api/server-entry.server.js");
  return handleAuthenticatedApi(request);
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: { GET: handle, POST: handle, PUT: handle, PATCH: handle, DELETE: handle, OPTIONS: handle },
  },
});

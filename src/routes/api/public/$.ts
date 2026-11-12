import { createFileRoute } from "@tanstack/react-router";

// Share-link visitors, the Telegram bot webhook, and scheduled jobs.
// Each endpoint verifies its caller inside handlePublicApi.
async function handle({ request }: { request: Request }) {
  const { handlePublicApi } = await import("@/api/server-entry.server.js");
  return handlePublicApi(request);
}

export const Route = createFileRoute("/api/public/$")({
  server: {
    handlers: { GET: handle, POST: handle, OPTIONS: handle },
  },
});

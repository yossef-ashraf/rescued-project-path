import { createFileRoute } from "@tanstack/react-router";

const MIME: Record<string, string> = {
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif",
  svg: "image/svg+xml", ico: "image/x-icon", avif: "image/avif", bmp: "image/bmp", mp4: "video/mp4", zip: "application/zip",
  txt: "text/plain; charset=utf-8", md: "text/markdown; charset=utf-8", css: "text/css; charset=utf-8", csv: "text/csv; charset=utf-8",
  json: "application/json; charset=utf-8", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xls: "application/vnd.ms-excel",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation", ppt: "application/vnd.ms-powerpoint",
};

// Serves files uploaded through the app. Names carry a random component, as in the original app.
export const Route = createFileRoute("/uploads/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = decodeURIComponent(String(params._splat || ""));
        if (!key || key.includes("..") || key.includes("/") || key.includes("\\")) {
          return new Response("Not found", { status: 404 });
        }
        const ext = key.split(".").pop()?.toLowerCase() || "";
        const contentType = MIME[ext];
        if (!contentType) return new Response("File type not allowed", { status: 403 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("uploads").download(key);
        if (error || !data) return new Response("Not found", { status: 404 });
        const inline = /^(image|video|application\/pdf|text\/plain)/.test(contentType) && ext !== "svg";
        return new Response(data.stream(), {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${key.replace(/"/g, "")}"`,
            "Cache-Control": "private, max-age=3600",
            "X-Content-Type-Options": "nosniff",
            "Content-Security-Policy": "default-src 'none'; img-src 'self'; media-src 'self'; style-src 'unsafe-inline'; sandbox",
          },
        });
      },
    },
  },
});

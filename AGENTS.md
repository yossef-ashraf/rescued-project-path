<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Original Orbit pages/controllers are reused as-is: route files in `src/routes` wrap them with `src/shared/next-compat/*` (Next.js API adapters) — keeps the migrated code close to the source.
- All app data goes through `/api/*` (`src/api/server-entry.server.js`), which resolves the caller's Cloud session and runs controllers with a request-scoped database client (`src/shared/database`); `/api/public/*` is only for share links, Telegram and schedules, each verifying its caller.
- `src/shared/database/orm.js` is a Sequelize-compatible layer over the Cloud client; raw SQL is not supported — add features there instead of raw queries.
- Pages render in the browser (`defaultSsr: false`) because original components read browser state during render.
- Uploaded files not sent to Google Drive live in the private `uploads` bucket, served by `src/routes/uploads.$.ts`.

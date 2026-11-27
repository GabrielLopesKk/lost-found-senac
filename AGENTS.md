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

- The typed ported app lives in `src/app/`; route wrappers in `src/routes/` use TanStack Router, with compatibility components in `router-compat.tsx` and hooks in `router-hooks.ts`. Why: preserves the source experience without a second SPA runtime or unchecked TypeScript.
- Keep contexts, hooks, validation helpers and component variants in separate modules from component exports. Why: enables reliable Fast Refresh and strict ESLint without hiding source errors.
- Exclude platform-generated clients, route trees, model declarations and runtime caches from lint/format; keep all maintained source checked. Why: generated output is owned by the platform, not manually reformatted.
- Staff permission comes from `public.user_roles` via `is_staff()`, never from profile columns. Why: prevents privilege escalation.
- Photo AI analysis runs in `src/app/ai/photo.functions.ts` (createServerFn + AI Gateway) with local color-analyzer fallback in `src/app/lib/analyzePhoto.tsx`; never place client-imported server fns under a `server/` folder (import protection blocks it).
- Withdrawal codes are validated atomically by the database RPC; the panel normalizes pasted input, blocks overlapping submissions, and refreshes related SWR lists without replacing a committed success with a refresh error. Why: prevents duplicate handovers and misleading results.
- List reads in `src/app/data/api.tsx` go through `fetchAllRows` (paged `.range()`), and UI actions report a saved change as saved even if the follow-up refresh fails. Why: avoids silently truncated lists and false failures that cause duplicates.

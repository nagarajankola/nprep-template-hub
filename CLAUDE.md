@AGENTS.md

# NPrep Template Hub — project notes

Private, password-protected hub that catalogs NPrep HTML prototypes and gives each a
revocable public share link. Next.js 16 + Tailwind v4, Supabase (prod) / local JSON (dev),
deploy on Vercel. See `README.md` for usage.

## Next.js 16 gotchas (this repo relies on these)
- **Middleware is renamed `proxy`** — but this app uses **no proxy**. Auth is enforced in
  the admin page (`requireAdminPage()` → redirect) and in each admin API route (`getSession()` → 401).
- `params`, `cookies()`, `headers()` are **async** — always `await` them.
- Route handlers are **dynamic + Node runtime by default**. Cache Components is **off** on purpose.
- ESLint is ignored during `next build` (`next.config.ts`); TypeScript checking stays on.

## Architecture
- **Data layer** `src/lib/db/` — `index.ts` picks `supabase.ts` when `SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY` are set, else `local.ts` (writes `data/templates.json`).
- These `lib` modules (db, slug, inline-assets, types, util) **must not import `next`** —
  `scripts/import.ts` imports them via `tsx`, outside the Next runtime. Keep their internal
  imports relative (not `@/`).
- **Auth** `src/lib/auth.ts` — env creds + `jose` HS256 JWT in an httpOnly cookie.
- **Templates stored as self-contained HTML** (assets inlined via `src/lib/inline-assets.ts`).
- `/v/[token]` public share, `/preview/[id]` public render-by-id (both raw HTML responses,
  both public so "Open full screen" / preview URLs are shareable). Admin auth still gates the
  dashboard page and every `/api/*` route.

## Run / import
- `npm run dev` (login admin / Qwerty123#) · `npm run import -- <folder|file>`.
- Local dev needs no Supabase; set the two Supabase env vars to go live.

## Status (2026-06-11)
- Built + verified locally (login, gallery, live previews, upload, share, revoke, delete).
- 20 existing prototypes bulk-imported from `/Users/raj/Projects/templates`.
- **Pending:** Supabase project keys from Raj → switch backend → deploy to Vercel.

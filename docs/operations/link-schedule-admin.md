# XCAN scheduled link administration

## Routes and isolation
- `/admin/links`: daily link schedule editor, protected by existing ADMIN_PASSWORD/ADMIN_USERNAME Basic authentication over HTTPS.
- `/admin/links/data`: authenticated, same-origin JSON GET/PUT; independent server authentication even if proxy matcher changes.
- `/go/<slug>`: public, server-time (Asia/Seoul) 302 resolver; no cached redirects.
- Existing `/start`, `/schedule`, Android App Links, and Bible progress remain unchanged. An existing physical NFC tag will NOT use the new schedule unless its address is explicitly migrated. Do not rewrite existing production mappings without verifying actual tag/app behavior and user intent.

## Required installation
1. Keep existing server-side Supabase URL and service role credentials; never expose the service key to the browser.
2. Apply `supabase/migrations/202611190001_link_schedules.sql` to the existing Supabase project. It adds two isolated tables and one service-role-only RPC, with RLS and no anon/authenticated grants. Existing story tables are untouched.
3. Existing ADMIN_PASSWORD must be configured. No default production credential is provided. If absent, access fails closed (503).
4. Open `/admin/links`, choose `bible`, and load. Only a successful DB lookup allows editing. Blank lookup means a new slug, not storage failure.
5. Set fallback, slots, dates, and enable switch. Preview, then save (explicit live-effect confirmation). No example schedule is silently published.
6. Test `/go/bible` on mobile and server-side around time boundaries. Real DB read/write and concurrency must be verified before calling setup complete.

## Rules
- Daily recurring slots; optional inclusive start/end calendar dates, Korea time.
- Start included, end excluded; `24:00` is allowed only as an end. Split overnight slots at midnight.
- Active date/time overlaps are rejected instead of hidden priority selection.
- Disabled or no active slot uses the saved fallback. Storage failure is HTTP 503, not silent substitution or fake success.
- Internal destinations are limited to existing content paths. External destinations must be public-looking HTTPS URLs without credentials/ports. The server never fetches arbitrary destinations. Operators must verify availability and avoid indirect redirect chains.
- Save uses optimistic revision compare-and-swap in one DB transaction and an immutable revision snapshot. A conflict is 409. Restore loads a prior revision into the editor, then explicitly saves a new revision.
- Open pages are not forcibly redirected when a time boundary passes. Rules apply on a new visit.
- Basic auth reuses existing owner authentication; not a multi-tenant or per-user audit identity system.

## Verification
Focused schedule/auth/route/UI tests and production build. Mocked UI/API tests do not prove production Supabase installation. No credentials or real private URLs belong in fixtures.

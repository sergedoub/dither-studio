# Self-hosting

## Local processing only

```sh
npm ci
npm run build:web
npm run start:web
```

Open http://localhost:4782. The server listens on all interfaces. Use a firewall or reverse proxy appropriate to your environment. `/healthz` reports health; `/api/config` reports `enabled: false` when no cloud variables are configured.

To use Docker:

```sh
docker build -t dither-studio .
docker run --rm -p 4782:8080 dither-studio
```

For Railway, create your own project/service, connect your fork or upload this checkout, and use the included Dockerfile. Route the service domain to port 8080 (or Railway's injected PORT). Use `/healthz` as the health check. The hosting container has no persistent image data. Configure HTTPS at the hosting proxy. No hosted demo uptime is promised.

## Experimental Supabase library

The adapter supports email/password accounts and private original/output/settings saves. It is experimental: live authenticated save/reload and two-user isolation have not been verified for this release. Do not treat passing mocked client tests as evidence of database enforcement.

1. Create a dedicated Supabase project under your account.
2. Apply `supabase/migrations/202609100001_dither_library.sql` once through the SQL editor, or your normal migration workflow. The policy creation statements are not rerunnable without migration tracking.
3. Verify `public.dither_projects` has RLS enabled and explicit authenticated grants. Verify `dither-images` is private, PNG-only, and limited to 20 MB per object.
4. Set Auth Site URL and allowed redirects to your deployed HTTPS origin. Keep email confirmation enabled. Configure your own SMTP for external users; Supabase's default email sender is restricted and unsuitable for public registration. See [Supabase email setup](https://supabase.com/docs/guides/auth/auth-smtp).
5. Copy `.env.example` to `.env` and supply your project URL and publishable key. Never use a secret or service-role key. The publishable key is intentionally visible to browsers; access depends on authenticated owner policies.
6. Start with `node --env-file=.env web/server.mjs`, or configure those environment variables in your hosting service. Vite's development server does not provide `/api/config`; use the built server for cloud testing.

No production credentials are needed for CI. Use a separate disposable project for testing. Before enabling real users, verify that user A can save/reload, user B cannot read or write A's records or paths, signed-out requests fail, and failed metadata writes clean up uploaded objects. Check recovery and sign-out behavior too.

## Data lifecycle and operating limits

An explicit save creates two PNGs under `<owner UUID>/<save UUID>/` and one settings record. Each save is a new version; the UI displays the latest 100. Thumbnails use five-minute signed links, which remain usable until expiration even after sign-out. No public bucket or administrator key is required.

There is currently no in-app delete button, account deletion, password recovery flow, storage quota per user, or automatic retention job. Operators must establish retention and cost limits before wider use. To honor deletion requests, verify the owner, remove the matching files through the Supabase Storage API/dashboard, and then remove the matching metadata rows. Do not delete storage metadata directly with SQL. Remove files before deleting an account; the table's user foreign key does not automatically delete stored objects.

Back up database metadata and image objects according to your provider's capabilities; do not assume a database backup includes object contents. Test restores. The project provides no cloud operation or support SLA.

See [Storage access control](https://supabase.com/docs/guides/storage/security/access-control) and [SECURITY.md](../SECURITY.md).

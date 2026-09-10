# Dither Studio web edition

Web editor: https://web-production-9e39a.up.railway.app

## Infrastructure

- Railway workspace: Serge's Projects (`9a4da10e-74e6-4e2f-9d88-76051bd62469`).
- Dedicated Railway project: `44cf8c76-47ab-432e-922a-6343be0f248d`; service `web` (`69f5392d-316c-42fc-839d-a2b451546e4d`).
- Dedicated Supabase project: Dither Studio (`epxqlcijobcohdnpnujt`) in Serge (`kkydngzjgdlcwdhnutlk`), free Nano, us-east-1.
- Private bucket: `dither-images`, PNG only, 20 MB per object.
- Table: `public.dither_projects`; schema tracked in `supabase/migrations/202609100001_dither_library.sql`.

The browser runs the same processing worker as the desktop app. Railway serves the editor and public connection configuration; it never receives uploaded images. Explicit cloud saves upload the original PNG, full-resolution output PNG, and settings to Supabase. Each save creates a new version. The account library displays the newest 100 versions.

Storage paths are `<user UUID>/<project UUID>/source.png` and `output.png`. Row and Storage policies restrict reads, inserts, and cleanup to the authenticated owner. Thumbnails use signed URLs lasting five minutes. The bucket is not public. The app uses only a publishable key; no service-role key belongs in browser code or Railway variables.

## Run and deploy

```sh
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci
npm run build:web
npm test
npm run start:web
```

For local cloud use, set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` using `.env.example` as a guide. Node does not load `.env` automatically: export the variables or use `node --env-file=.env web/server.mjs`. Without configuration, local editing and downloading still work.

The Docker build creates a small static web distribution and runs an unprivileged Node HTTP server on Railway's `PORT`. `/healthz` reports health and whether cloud configuration is present. `/api/config` exposes only the project URL and public key; the server rejects privileged Supabase keys.

Deploy from this directory using `railway up --service web --detach`. The local CLI project link must point at the dedicated project above. Check `railway status` before future deployments. Never reuse another application's Supabase bucket or Railway service.

## Authentication setup

Email and password authentication uses Supabase Auth. Set the Auth Site URL and redirect allowlist to the live origin above. Email verification should remain enabled.

Supabase's default email service only sends confirmation messages to organization team addresses, with a low rate limit. It is suitable for the owner's initial use. Public registration for other people requires custom SMTP; see https://supabase.com/docs/guides/auth/auth-smtp. No custom SMTP has been configured by this deployment.

## Verification

- Production web build passes.
- 19 automated tests pass, including all 41 algorithms, output correctness, private save paths, partial-upload cleanup, upload limits, safe public configuration, and HTTP source-file restrictions.
- Live Railway editor renders the demo, changes to Bayer 8×8, displays split comparison, and reports a 1200×1200 PNG export without browser console errors.
- Phone-width layout tested at 390×844 with no horizontal page overflow; controls remain reachable below the canvas.
- The Supabase migration was applied successfully on September 10, 2026.
- Cloud API connection and signed-in storage round-trip verification are pending final dashboard configuration.

The original plugin's undocumented algorithms remain independent approximations, as documented in the main README. Web hosting does not change those limits. The installed desktop application continues to work offline.

# Security policy

Security fixes target the latest published release and the default branch. Older releases are not maintained separately. There is no guaranteed response time.

Please report vulnerabilities through [GitHub private vulnerability reporting](https://github.com/sergedoub/dither-studio/security/advisories/new). Reports are received by the repository maintainer, @sergedoub. Do not open a public issue containing an exploit, private image, credential, or user data.

Include affected version, a minimal reproduction, expected access boundary, and impact. Use test accounts and synthetic images. Do not probe other users' data or the maintainer's hosted infrastructure.

The Electron renderer is sandboxed with context isolation and a restricted native export bridge. Browser processing is local. Optional cloud uploads use a public Supabase key and owner-scoped database/storage policies. Cloud integration is experimental and has not passed live authenticated isolation testing for this release. Never put a secret/service-role key in browser configuration. Self-hosters are responsible for HTTPS, backups, authentication email delivery, retention, and cloud costs.

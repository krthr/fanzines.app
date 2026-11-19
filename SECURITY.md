# Security policy

Fanzines runs almost entirely in the browser. A zine and its images stay in memory on the user's device and are never uploaded. The server side is a Cloudflare Worker that serves the prerendered pages.

## Reporting a vulnerability

Please don't open a public issue. Report it privately through GitHub instead: on the [Security tab](https://github.com/krthr/fanzines.app/security), choose **Report a vulnerability**, or go straight to [the private report form](https://github.com/krthr/fanzines.app/security/advisories/new).

Include what you found, how to reproduce it, and what an attacker could do with it. You'll get a reply in the advisory, and the fix will be coordinated with you there before anything is made public.

## Scope

Only the live site, [fanzines.app](https://fanzines.app), and the `main` branch of this repository are supported.

In scope, for example:

- Script injection through zine text, image files or URLs.
- A way for another site or user to read or change someone's zine.
- Problems in the Worker or its configuration.

Out of scope:

- Vulnerable dependencies with no realistic path to exploitation in this app. Dependabot tracks those.
- Missing security headers or best practices without a demonstrated impact.
- Denial of service, spam and social engineering.

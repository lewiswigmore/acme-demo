# Security policy

This project is a local-only, fictional demonstration. It is not a production
service, security sandbox, or a place to store personal or confidential data.
There is no deployment and no authentication. Everyone who can reach the app
shares its synthetic demo data.

Only the current default branch is maintained. Use the supported Node.js version
in the README and install dependencies with the committed lockfile.

## Reporting a vulnerability

Use the repository's **Security > Advisories > Report a vulnerability** option
when available. Do not put credentials, personal information, or working exploit
payloads in public issues. If private reporting is unavailable, open a minimal
issue asking a maintainer to enable private reporting without disclosing details.

## Boundaries

The local database and environment files must remain ignored by Git. Never add
real accounts, API keys, analytics, payment services, outbound webhooks, or
production integrations to this demo without a separate security review.

Input validation and browser protections do not make an unauthenticated demo
safe to expose to a network. Keep the loopback binding. Do not use a public
tunnel or deploy it without adding appropriate access controls and operational
protections.

Read CONTRIBUTING.md before evaluating untrusted pull requests.

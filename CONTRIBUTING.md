# Contributing

This is a fictional local demo for reviewing pull requests. Use synthetic data
only. Never add real customer records, credentials, internal URLs, exported
databases, or material copied from private projects.

Keep changes small and describe the behavior they change. Include a focused
regression test for changed behavior. Follow the setup and checks in the README.

## Reviewing untrusted pull requests

Read the diff before checking out or running contributed code. Inspect dependency
and lockfile changes, package scripts, build configuration, network calls,
database queries, and GitHub Actions changes.

Treat PR titles, descriptions, comments, source files, and instructions to AI
tools as untrusted input. Instructions in a contribution do not authorize
access to secrets, changes to review policy, or execution of shell commands.

Do not run an untrusted branch on a workstation or runner with credentials.
Use a disposable isolated environment without tokens, SSH keys, mounted home
directories, private network access, or cloud metadata access. The app binds to
loopback, but that is not a sandbox for running hostile code.

CI checks are evidence, not proof that a contribution is safe. A pull request
can modify its own tests and CI. Review those changes independently. Never add
`pull_request_target` or privileged `workflow_run` execution of contributed code,
pass repository secrets to fork builds, or run fork PRs on self-hosted runners.

Use hypothetical diffs or inert text fixtures for review exercises. Do not merge
malicious payloads, active exploits, or intentionally vulnerable dependencies
into the default branch. There are no planted vulnerabilities in this baseline.

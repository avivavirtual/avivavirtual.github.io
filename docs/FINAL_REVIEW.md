# Final Review Notes

## What is now covered locally

The repository includes no-network review checks so scaffold quality can be verified even when the npm registry is blocked by the execution environment:

- `npm test` runs all unit and functional smoke tests with Node's built-in test runner.
- `npm run test:unit` validates deterministic platform rules such as widget origin matching, safe widget colors, ticket numbering, and SLA due dates.
- `npm run test:functional` validates architecture documentation, security-sensitive source guardrails, required runtime files, and root test script wiring.
- `npm run check:registry` reports whether the external npm registry is reachable without failing the review when this sandbox blocks registry access.
- `npm run review` runs the local no-network review suite plus the registry reachability report.

## Why package-lock generation is not forced in this sandbox

`npm install --package-lock-only --ignore-scripts` requires outbound access to the configured npm registry. This sandbox currently returns HTTP 403 for registry requests before npm can fetch `@types/node`. That is an environment restriction rather than an application failure. The project still keeps normal `npm install`/CI workflow commands for environments with registry access, while local review can use the no-network tests above.

## Human review checklist

- Confirm each public widget request validates `allowedDomains` and PIPEDA consent before processing customer text.
- Confirm AI retrieval remains tenant-scoped by `organizationId`.
- Confirm auth responses do not return `passwordHash` and refresh tokens are hashed at rest.
- Confirm Mermaid diagrams in `docs/ARCHITECTURE.md` explain platform, code, chat, voice, and RAG flows in plain language.

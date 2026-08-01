# Security policy

## Reporting a vulnerability

Do not open a public issue containing exploit details, credentials, customer data, or private infrastructure information.

Report security concerns privately to:

```text
skysthelimitpainting1779@gmail.com
```

Include the affected path or component, reproduction steps, impact, and any safe proof of concept. Remove real secrets and personal information from the report.

## In scope

- authentication and authorization boundaries;
- customer, crew, operations, and lead data exposure;
- cross-account or cross-organization access;
- secret or environment leakage;
- webhook, idempotency, and replay weaknesses;
- unsafe file handling;
- Preview-to-Production resource crossover;
- payment or external-effect activation;
- dependency and deployment-chain vulnerabilities.

## Repository rules

- Never commit credentials or real `.env` files.
- Preview resources must remain isolated from Production.
- Public Convex mutations require validators and server-side authorization or abuse controls appropriate to the data.
- Production effects require explicit owner approval.
- Security findings must be verified against the exact affected commit.

## Supported code

Security fixes target the default branch and active, unmerged release candidates. Legacy repositories and abandoned branches are not supported unless a currently deployed system still depends on them.

## Response

A report will be acknowledged after it is reviewed. Do not publish the issue until a remediation and disclosure plan is agreed upon.

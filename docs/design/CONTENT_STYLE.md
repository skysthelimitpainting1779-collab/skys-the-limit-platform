# Content and claim policy

## Rule

Describe verified business facts, buyer questions, intake structure, and planned platform boundaries. Do not publish a capability, certification, operational process, product standard, scheduling promise, payment feature, customer result, or public-sector qualification without source evidence and an approved use in the Proof & Permission Ledger.

## Allowed language

- Explain what information a buyer should provide.
- Describe what the system currently does and what remains inactive.
- State that products, methods, schedules, access plans, compliance requirements, and eligibility are confirmed after review.
- Link public calls to action to the structured estimate intake.

## Prohibited language without evidence

- Superlatives or quantified performance claims.
- Certifications, registrations, wage-program status, bonding, insurance limits, or award history.
- Named products, coating systems, warranties, or mandatory field procedures.
- Promises about crew size, shift availability, disruption, completion dates, or cleanup cadence.
- Portal features, payments, signatures, messaging, or private-data access that are not provisioned and verified.

## Enforcement

`npm run verify:content` scans public routes and shared page components for known unsupported claims, raw colors, and non-semantic palette utilities. Unit tests provide a second independent gate for the inherited high-risk pages.

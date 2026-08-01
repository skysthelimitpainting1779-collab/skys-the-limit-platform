# GitHub security capability boundary

## Observed limitation

On 2026-08-01, `actions/dependency-review-action` failed with: dependency review is not supported on this private repository unless the dependency graph and GitHub Advanced Security are enabled.

The bootstrap requirement is zero upfront spend. Therefore the repository does not pretend that a paid control is active.

## Required free controls

- `Security Policy`: rejects committed environment files and validates environment, asset, and external-effect contracts.
- `npm Audit`: fails on high-severity production dependency advisories.
- Secret-blocking Husky checks remain defense in depth; remote CI is authoritative.
- Vercel Preview and Production credentials remain isolated.

## Deferred controls

Enable CodeQL, Dependency Review, secret scanning, and push protection for the private repository only when GitHub Advanced Security is available or billing is explicitly approved. At that point, pin each action to an immutable commit SHA and add the emitted check names to the live rulesets.

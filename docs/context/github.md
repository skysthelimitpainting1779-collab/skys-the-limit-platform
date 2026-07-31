# GitHub CI/CD & Governance Context & Contract

- **Research Date**: 2026-07-31
- **Official Source**: GitHub Actions & Rulesets documentation
- **Selected Version / Contract**: GitHub Actions with branch rulesets for `main` and `dev`
- **Decision Affected**: Automated testing, security analysis, pull request workflows.
- **Important Constraints**:
  - `dev` requires 1 PR approval, status checks, and linear history.
  - `main` requires `dev` source, exact-head CI green, security green, and Vercel preview ready.

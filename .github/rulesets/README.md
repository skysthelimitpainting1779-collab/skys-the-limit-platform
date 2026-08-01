# GitHub Repository Rulesets

This directory contains the GitHub Repository Ruleset definitions for the `skys-the-limit-platform` repository.

## Rulesets Overview

### 1. `dev.json` — Protect `dev` Branch
- **Target Branch**: `refs/heads/dev`
- **Enforcement**: `active`
- **Rules**:
  - **Block Deletion**: Prevents deletion of the `dev` branch.
  - **Block Force Pushes** (`non_fast_forward`): Enforces fast-forward merges only.
  - **Pull Request Requirements**:
    - Minimum 1 approving review required (`required_approving_review_count: 1`)
    - Stale reviews dismissed on new pushes (`dismiss_stale_reviews_on_push: true`)
    - Required review conversation resolution (`required_review_thread_resolution: true`)
  - **Required Status Checks**:
    - `Validate` (CI build & unit test suite)
    - `Branch Policy` (Branch naming convention check)
    - `CodeQL Analysis` (Security scanning)

### 2. `main.json` — Protect `main` Branch (Production)
- **Target Branch**: `refs/heads/main`
- **Enforcement**: `active`
- **Rules**:
  - **Block Deletion**: Prevents deletion of the `main` branch.
  - **Block Force Pushes** (`non_fast_forward`): Enforces fast-forward merges only.
  - **Pull Request Requirements**:
    - Minimum 1 approving review required (`required_approving_review_count: 1`)
    - Stale reviews dismissed on new pushes (`dismiss_stale_reviews_on_push: true`)
    - Required review conversation resolution (`required_review_thread_resolution: true`)
  - **Required Status Checks**:
    - `Validate` (CI build & unit test suite)
    - `Branch Policy` (Branch naming convention check)
    - `Release Gate` (Release source verification & owner gate check)
    - `CodeQL Analysis` (Security scanning)
  - **Linear History**: `required_linear_history` enforced.

---

## Application Commands (`gh api`)

To apply or update these rulesets via GitHub CLI (`gh`):

```bash
# Apply dev ruleset
gh api repos/skysthelimitpainting1779-collab/skys-the-limit-platform/rulesets \
  --method POST \
  --input .github/rulesets/dev.json

# Apply main ruleset
gh api repos/skysthelimitpainting1779-collab/skys-the-limit-platform/rulesets \
  --method POST \
  --input .github/rulesets/main.json

# Query existing rulesets
gh api repos/skysthelimitpainting1779-collab/skys-the-limit-platform/rulesets
```

---

## License & Plan Requirements Note

- **GitHub Rulesets** on private repositories require **GitHub Pro, Team, or Enterprise** accounts (or public repository visibility).
- If `gh api` returns HTTP 403 (`Upgrade to GitHub Pro or make this repository public`), repository administrators must either:
  1. Upgrade the organization / user account to GitHub Pro/Team/Enterprise, or
  2. Configure equivalent Classic Branch Protection rules in Repository Settings → Branches.

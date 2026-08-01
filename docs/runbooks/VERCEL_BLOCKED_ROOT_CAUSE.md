# Vercel BLOCKED deployment root cause

## Evidence

Foundation commits authored by `johnnycsv232` repeatedly produced Vercel deployments in `BLOCKED` state before any build event existed. The latest affected deployment was `dpl_zHoMLUv7i3KqEAqzr5jaC3gYVdX8`.

The first commit on `feature/estimate-lead-intake-e2e` was created through the authorized GitHub installation as `skysthelimitpainting1779-collab`. The same Vercel project accepted it and produced READY Preview deployment `dpl_6kmUmQegoVEC93xYHGLJK7K8VjFr` for exact commit `6ed7fa7270a14fb3aa5a78d3e1ef28adae91d5f0`.

## Root cause

The blocked state was a Git-author authorization gate, not a Next.js build failure. No build logs existed because Vercel rejected deployment creation before build execution.

## Resolution

- Commit and push through a GitHub identity authorized for the `skys` Vercel team.
- Do not bypass Vercel deployment access controls.
- Do not add a paid team seat without explicit owner approval.
- Verify every future Preview by exact Git SHA, project ID, team ID, and immutable deployment ID.

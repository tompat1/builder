# Testing and deployment verification gate

## Goal

Make local commits and pushes fail early when type, lint, test, integration, or
production-bundle checks are broken. Cloudflare and other CI providers must
never be the first place routine quality errors are discovered.

## Required public commands

Every generated repository must define equivalent commands for its package
manager and stack. For npm projects, use these exact script names:

| When | Command | Purpose |
| --- | --- | --- |
| Before every commit | `npm run preflight` | Fast typecheck and lint gate |
| Before every push | `npm run build` | Run the full gate, then create the production bundle |
| Before deploys, large changes, and final handoff | `npm run test:gate` | Complete project verification suite |
| CI and Cloudflare | `npm run build` | Backstop the same verified build already run locally |

`preflight` should normally finish quickly enough to run before every commit. At
minimum it must include all configured static checks:

```json
{
  "scripts": {
    "preflight": "npm run typecheck && npm run lint"
  }
}
```

`test:gate` must include every verification tier the repository actually uses,
for example:

```json
{
  "scripts": {
    "test:gate": "npm run typecheck && npm run lint && npm test && npm run test:e2e"
  }
}
```

Add Python, integration, migration, security, or data-pipeline suites when they
exist. Do not add passing no-op scripts for missing tiers; either configure the
real check or document why the tier does not apply.

## Verified production build

The production build must run the complete gate before any bundle is created.
For projects that need a shell wrapper, use a checked-in script such as
`scripts/build-verified.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

npm run test:gate
npm run build:bundle
```

Then expose it through `package.json`:

```json
{
  "scripts": {
    "build": "bash scripts/build-verified.sh",
    "build:bundle": "vite build"
  }
}
```

Adapt `build:bundle` to the framework. Avoid recursive definitions where
`build-verified.sh` invokes `npm run build` again.

Cloudflare Pages or Workers must call the verified `npm run build`; deployment
configuration must not bypass it by calling the bundler directly. Run that same
build locally before push so Cloudflare is repeating a known-clean operation.

## Enforced local hooks

After configuring the project scripts, install the template's fail-closed hooks:

```bash
bash execution/install-git-hooks.sh
```

The pre-commit hook requires and runs `preflight`. The pre-push hook requires
`test:gate` to exist and runs the verified production `build` once. That build
must execute `test:gate` before bundling, so the hook does not run the gate a
second time. For non-npm repositories, provide executable `scripts/preflight`
and `scripts/build-verified` equivalents.

Missing scripts are errors, not reasons to skip validation. Do not use
`--no-verify` to bypass the hooks. If an emergency exception is ever necessary,
it must be explicitly authorized and documented; the CI gate still remains
mandatory.

## Standard workflow

1. Implement the change and its focused tests.
2. Run the relevant focused checks while iterating.
3. Run `npm run preflight` immediately before every commit.
4. Run `npm run build` immediately before every push. The build must run
   `test:gate` before bundling.
5. Rerun `npm run test:gate` before a deploy, large-change handoff, or completion
   claim when no push/build has just verified the exact same tree.
6. Fix failures at their source and rerun the failed command.
7. Rerun the required combined gate from the beginning before continuing.

Warnings may remain only when the project's written policy explicitly allows
them. Errors always block push and deployment.

## Repository bootstrap checklist

When creating a repository from this template:

1. Detect the actual language, framework, package manager, and deployment
   target.
2. Configure real typecheck, lint, unit, integration, and E2E commands that
   apply to the project.
3. Add the `preflight` and `test:gate` entry points.
4. Make the production build execute `test:gate` before bundling.
5. Install the local hooks with `bash execution/install-git-hooks.sh`.
6. Configure CI and Cloudflare to use the verified production build and make
   that check required before merge where the hosting workflow supports it.
7. Run `preflight`, `test:gate`, and the production build once, then record any
   project-specific exceptions below.

## Failure protocol

If a gate fails:

1. Stop the commit, push, or deployment.
2. Read the complete error and reproduce the failing tier directly.
3. Fix the implementation, configuration, or legitimate test contract.
4. Do not disable, skip, or weaken the check merely to make the gate pass.
5. Rerun the failed tier, then rerun the required combined gate.
6. Add durable lessons or project-specific edge cases to this directive.

## Project-specific checks

The pre-push hook runs `npm run build` once. `scripts/build-verified.sh` already
runs `test:gate` before `build:bundle`. Do not add a second `test:gate`
invocation to the hook. The duplicate end-to-end run made every push take about
twice as long.

Record additional commands, allowed warnings, CI requirements, deployment
details, and known test isolation constraints here as the repository evolves.

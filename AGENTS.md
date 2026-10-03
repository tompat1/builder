# Agent entry point

Before doing any work in this repository, read and follow
[`.agents/AGENTS.md`](.agents/AGENTS.md). It contains the repository operating
principles and directive routing.

For repository setup, testing, builds, pushes, CI, or deployment, read and
follow [`directives/testing_and_deployment.md`](directives/testing_and_deployment.md).

Required quality gates:

- Before every commit, run the project's fast `preflight` gate.
- Before every push, run the verified production build. It must execute the
  complete `test:gate` before bundling.
- Before a deploy, large change, or final handoff, rerun the complete gate.
- Never commit, push, deploy, or claim completion while a required gate is
  missing or failing.
- In npm projects, expose these gates as `npm run preflight` and
  `npm run test:gate`. Production `npm run build` must run the full gate before
  creating the bundle.
- Install the repository hooks with `bash execution/install-git-hooks.sh` after
  configuring the project commands. Do not bypass them with `--no-verify`.

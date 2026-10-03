# Agentic Workspace Boilerplate

This repository serves as a template for setting up a structured pair-programming workspace optimized for agentic coding models (like Claude, Gemini, etc.) using the **3-Layer Architecture** and a **Multi-Model Routing Strategy**.

## 🏗️ Structure Overview

```
.
├── AGENTS.md               # Root entry point and mandatory quality-gate routing
├── .agents/
│   └── AGENTS.md           # Core agent instructions & persona triggers
├── .githooks/
│   ├── pre-commit          # Blocks commits with type or lint failures
│   └── pre-push            # Blocks pushes unless the verified build passes
├── directives/
│   ├── README.md           # Layer 1: Standard Operating Procedures (SOPs)
│   └── testing_and_deployment.md
│                           # Pre-push and production verification contract
├── execution/
│   ├── README.md           # Layer 3: Deterministic execution scripts (Python)
│   └── install-git-hooks.sh
│                           # Enables the repository quality hooks
├── scripts/
│   ├── preflight           # Structural gate used before this template's commits
│   └── build-verified      # Verified no-bundle build for this template
├── .tmp/
│   └── .gitkeep            # Untracked workspace directory for intermediate files
├── .env.example            # Environment variables baseline
└── .gitignore              # Preconfigured Git ignore patterns
```

## 🚀 How to Use This Template

1. Click **"Use this template"** on GitHub to create your new repository.
2. Clone your new repository locally.
3. Configure your local `.env` by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Define your project goals in `directives/` and write automation scripts in `execution/`.
5. Configure the real quality commands for the chosen stack. For npm projects,
   add `preflight`, `test:gate`, and a verified `build` as specified in
   [`directives/testing_and_deployment.md`](directives/testing_and_deployment.md).
6. Install the fail-closed local hooks:
   ```bash
   bash execution/install-git-hooks.sh
   ```
7. Run `npm run preflight` before commits and the verified `npm run build`
   before pushes. CI and Cloudflare rerun that build as a backstop.
8. Start pair programming. Agents read `AGENTS.md`, which routes them to the
   core instructions and mandatory directives.

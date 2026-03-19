# Roadmap 004: Project Organization & Logical Structure

## Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Create `docs/` subdirectory structure | ✅ DONE |
| Phase 2 | Migrate loose markdown files from root to `docs/` | ✅ DONE |
| Phase 3 | Move `RoadMap/` → `docs/process/roadmaps/` and update references | 🔄 IN PROGRESS |

---

## Objective

Clean up the project root and establish a logical hierarchy for documentation and process files to improve maintainability and developer experience, without breaking application functionality.

---

## Root File Policy

The following files **stay at root** by convention and must not be moved:

| File | Reason |
|------|--------|
| `README.md` | GitHub/npm standard — first file visitors see; rendered automatically on GitHub |
| `AGENTS.md` | AI agent configuration — tooling (Claude Code, Gemini CLI) expects this at root |
| `GEMINI.md` | Primary project changelog/action log — agent-written, agent-read at root |
| `.env` / `.env.example` | Runtime environment config — loaders resolve from project root |
| `package.json` | Node.js project manifest — must be at root |
| `next.config.ts` | Next.js config — resolved relative to root at build time |
| `tsconfig.json` | TypeScript config — resolved from root |
| `tailwind.config.ts` | Tailwind config — resolved from root |
| `postcss.config.mjs` | PostCSS config — resolved from root |

Everything else (docs, process files, roadmaps) belongs under `docs/`.

---

## Best Practices

- **Root Minimization**: Keep the project root focused on configuration and entry points only.
- **Categorical Grouping**: Group files by domain (Product, User, Process, Philosophy).
- **Consistent Naming**: Use lowercase, hyphen-separated filenames.
- **Fail-Safe Moves**: Only `.md` files are moved — zero impact on build pipeline (Next.js/InsForge).

---

## Phase 3: Remaining Work

### Move `RoadMap/` → `docs/process/roadmaps/`

```
docs/process/roadmaps/
├── 001-nano-banana.md
├── 002-chat-canvas-interaction.md
├── 003-implementation-plan.md
└── 004-project-organization.md   ← this file
```

None of these files are imported by application code. Moving them has **zero build impact**.

### Update `GEMINI.md`

- Line 9: change `RoadMap/004-project-organization.md` → `docs/process/roadmaps/004-project-organization.md`

### Create `docs/README.md`

Add a navigation index so the docs hub is immediately discoverable.

### Remove empty `RoadMap/` directory from root

After all files are moved, delete the now-empty `RoadMap/` directory.

---

## Final Target Structure

```
/project-root/
├── README.md                  ← stays (GitHub standard)
├── AGENTS.md                  ← stays (AI agent config)
├── GEMINI.md                  ← stays (project action log)
├── .env / .env.example        ← stays (runtime config)
├── package.json               ← stays (Node.js manifest)
├── next.config.ts             ← stays (Next.js config)
├── tsconfig.json              ← stays
├── tailwind.config.ts         ← stays
├── postcss.config.mjs         ← stays
├── src/                       ← application code (unchanged)
├── insforge/                  ← backend functions (unchanged)
├── public/                    ← static assets (unchanged)
└── docs/
    ├── README.md              ← navigation index
    ├── product/
    │   ├── PRD.md
    │   ├── core_features.md
    │   └── future.md
    ├── user/
    │   └── user_profile.md
    ├── philosophy/
    │   └── simple-always.md
    └── process/
        ├── done-todo.md
        └── roadmaps/
            ├── 001-nano-banana.md
            ├── 002-chat-canvas-interaction.md
            ├── 003-implementation-plan.md
            └── 004-project-organization.md
```

---

## Validation Checklist

- [ ] All 4 roadmap files present under `docs/process/roadmaps/`
- [ ] `RoadMap/` directory at root is removed
- [ ] `GEMINI.md` line 9 updated to `docs/process/roadmaps/004-project-organization.md`
- [ ] `docs/README.md` exists with navigation index
- [ ] `npm run build` passes (0 errors)

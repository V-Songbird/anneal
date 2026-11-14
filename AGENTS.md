# anneal

anneal is one plugin for Claude Code, Codex and Antigravity: skills and scripts that audit how
easily an agent navigates a repository, turn session detours into approved map-file changes and
reconcile documentation with current behavior. Its scripts and hooks are dependency-free Node.js
and run with Node.js 22 or later and Git; there is no install or build step. This repository is
mounted by the Foundry marketplace as a submodule and ships from `main`.

## Start here

- Before changing a skill, a script or a hook, read [the workflow guide](docs/knowledge/workflows.md); it states every finding, approval boundary and limit the code must keep.
- Before changing an eval case or a grader, read [Running the evals](docs/knowledge/workflows.md#running-the-evals).
- Before a release, read [the changelog](docs/knowledge/changelog.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## Rules that outrank everything

- No anneal command edits a project on its bare name: audits report, and every change waits for the owner's approval of that step.
- The three manifests, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` and `plugin.json`, carry the same name, version, description and author, changed together; `tests/manifests.test.js` fails when they differ or when the changelog's newest entry is another version.
- The root `plugin.json` is Antigravity's manifest. It carries no `$schema` and no `com.openai` extension, so Codex keeps reading `.codex-plugin/plugin.json` and finds its hooks.
- A public file never names another project except where it was measured, and states only numbers that were measured.

## Commands

Run from the repository root.

| Command | Purpose | Cost |
| --- | --- | --- |
| `node --test` | The suite: scripts, hooks, manifests and eval graders, with no model session | Local temporary fixtures |
| `node scripts/git-hooks/check-readme-nav.js` | The root README has its nav line, and every heading anchor linked from a tracked Markdown file resolves | Local |
| `node scripts/audit.js --root .` | anneal's own navigation audit, on this repository | Read-only, local |
| `claude plugin validate .` | Claude Code package shape | Local; needs the `claude` CLI |
| `agy plugin validate .` | Antigravity package shape; it warns that `hooks/hooks.json`, Claude Code's file, is never loaded | Local; needs the Antigravity CLI |
| `git config core.hooksPath scripts/git-hooks` | One-time: the pre-commit hook runs the suite and the nav check | Local |

Live eval sessions bill a model and need a sandbox; their commands are in [Running the evals](docs/knowledge/workflows.md#running-the-evals).

## Where things live

| Path | Content |
| --- | --- |
| `skills/` | `overview`, `repo-layout`, `repo-docs` and `session-review`, each with its references |
| `agents/mapper.md` | The read-only layout surveyor the repo-layout skill starts |
| `scripts/` | The audit, documentation, README and session-evidence scripts the skills run; `scripts/git-hooks/` holds the commit gates |
| `hooks/` | The safety guard, the instruction guard and the session-start line; `hooks/hooks.json` is Claude Code's wiring and `hooks/codex-hooks.json` is Codex's |
| `hooks.json`, `plugin.json` | Antigravity's hook wiring and manifest, at the root |
| `templates/` | The documentation rule and ignore rules that `repo-docs adopt` writes into a project |
| `evals/` | Eval cases for `claude plugin eval`, with their fixtures and graders |
| `tests/` | The `node:test` suite |
| `docs/knowledge/` | The workflow guide and the changelog |
| `assets/` | Copies of the brand kit's images; change them in the kit, never here |

## Conventions

Root JavaScript is CommonJS. The README serves every host and names the host beside each
host-specific instruction. `CLAUDE.md` imports this file; keep shared contributor facts here.

## Pitfalls

- **Navigation findings are heuristic.** The runtime-name examples in `tests/audit.test.js` exercise the detector on purpose, and the audit also reports two matches in `scripts/session-evidence-navigation.js`.
- **`tests/eval-harness.js` has a twin.** collet keeps the same file as `tests/eval-harness.cjs`; change both together, since no test compares the two repositories.
- **On Node.js 22 a suite that fails outside its tests can still exit 0.** A `describe` callback or an `after` hook that throws is reported but left out of the exit code.
- **Some write tools turn a `\u` escape back into the raw character.** After writing an invisible-character escape, check that the file still holds the escape.
- **Passing subprocess tests do not prove installed-host behavior.** Hook discovery, trust and prompts need a session on the host.

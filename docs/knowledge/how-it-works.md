---
type: knowledge
summary: "What each anneal skill, script and hook reads, reports and may change, with every finding, option and limit; read before running a skill or changing a script, and to predict what anneal will do to a repository."
related_files:
  - README.md
  - skills/overview/SKILL.md
  - skills/repo-layout/SKILL.md
  - skills/repo-docs/SKILL.md
  - skills/session-review/SKILL.md
  - scripts/audit.js
  - scripts/readme-check.js
  - scripts/docs-check.js
  - hooks/hooks.json
---

# How Anneal works

This page says what each Anneal skill reads, reports and may change. It is for a user who wants to predict what Anneal will do. The short form is in the README, under [How it works](../../README.md#how-it-works).

Each skill runs a script that reads your repository or a session transcript, then reports. The scripts use no model, write nothing and are dependency-free Node.js. Findings are heuristics, none verified.

No command edits a project on its bare name:

- `overview` and both audits report.
- `repo-layout` and `session-review` propose and wait for your approval of each step.
- `repo-docs` applies ordinary fixes only with `fix` or a cleanup request in your own words.

An audit saves a file only after you say yes. A run nobody can answer, such as a headless one, writes nothing.

## Contents

- [Overview](#overview)
- [Layout audit](#layout-audit)
- [Start context, drift and left-behind memory](#start-context-drift-and-left-behind-memory)
- [What counts as a check command](#what-counts-as-a-check-command)
- [Migration](#migration)
- [Session review](#session-review)
- [Close-out](#close-out)
- [Repeated steps](#repeated-steps)
- [Documentation](#documentation)
- [Hooks](#hooks)
- [Script options](#script-options)

## Overview

`overview` gives two lines per part: navigation, documentation, past sessions and this session. Each line says what that part's script counted and which skill to run next.

A part whose script cannot run shows `not available`. A run can take half a minute on a project with many past sessions.

## Layout audit

Findings by severity:

| Severity | Findings |
| --- | --- |
| High | `map-file-missing` (no `CLAUDE.md`, `AGENTS.md` or `GEMINI.md`, at the root or in `.claude/`, `.agents/` or `.gemini/`); `check-command-missing`; `build-output-not-ignored`; `not-a-git-repo` |
| Medium | `map-file-long` (over 200 lines); `toolchain-version-missing`; `env-template-missing`; `duplicate-names`; `generic-names`; `large-files` (over 800 lines); `build-output-tracked` |
| Low | `index-files` (three or more); `deep-nesting` (six folders or more); `runtime-names`; `default-exports`; `re-export-files`; `check-command-split`; `instruction-hidden-characters` |

`instruction-hidden-characters` reads every `CLAUDE.md`, `AGENTS.md` and `GEMINI.md`, and the `.md` and `.mdc` files under `.agents/`, `.claude/`, `.cursor/rules/` and `.gemini/`. It reports zero-width characters, bidi controls, variation selectors, a byte order mark past the start and Unicode tags. Each report gives file, line and code point. Tags are only counted, since their code points spell the hidden text.

It skips what renders on screen, such as the joiner inside an emoji. It leaves a zero-width non-joiner in a script that needs it to you. `repo-layout` never removes the characters.

Observations with no severity follow:

- What each map file names.
- Which packages it reaches.
- Long documents.
- Tracked `dist/` folders that may hold source.
- Fixtures that look generated.

## Start context, drift and left-behind memory

The summary ends with a `start context` block. It counts the characters a Claude Code session reads before its first prompt, against a 20,000-character budget. The count covers:

- The root `CLAUDE.md`, `.claude/CLAUDE.md` and `CLAUDE.local.md`, with their `@path` imports.
- `.claude/rules/` files with no `paths:` key.
- Your global `CLAUDE.md`.
- The project's `MEMORY.md`, counted whole, so the total is an upper bound.

Your Codex global `AGENTS.md` gets a line outside the total. Past the budget, the last line says by how much; the audit proposes no edit.

When your global files alone pass a quarter of the budget, a pointer names two ways Claude Code loads text later: a `.claude/rules/` file with `paths:` globs, and a hook that returns `additionalContext`.

An `instruction drift` block lists the list items your Claude Code and Codex global files (or every `--global` file) do not share. It leaves out items that name a host. Which copy is right is yours to decide.

A `memory left behind` block names other Claude Code project folders whose transcripts name this repository, since a moved repository starts with no memory. The audit moves no file.

## What counts as a check command

At the root, a check command is any of these:

- A `package.json` script such as `test`, `lint` or `check`.
- A `Makefile` target or `justfile` recipe so named.
- A `scripts/` Node script.
- A harness runner such as collet's.
- A build tool's own check: `cargo test`, `go test ./...`, `dotnet test`, Gradle, Maven, `tox`, `nox` or `pytest`.
- `node --test`, when there is no `package.json` or `.gitmodules`.

Manifests below the root, CI-only steps, Unity tests and commands only prose names do not count.

## Migration

The migration runs your project's checks once first, so an earlier failure is never blamed on a later step.

For generic or duplicate names, large files, deep nesting or re-exports, the read-only `mapper` helper proposes which files belong together. You approve, trim or skip each proposal.

Approved steps land one commit each on the branch `anneal/<YYYY-MM-DD>`, cut from your `HEAD`. A branch of that name elsewhere stops the run. A step that breaks a check is fixed or set aside on its own branch.

It stops, leaving your branch as it was, when any of these holds:

- `git status --porcelain` prints anything.
- The repository has no commit.
- `git config user.email` is empty.

The map file it writes has the sections `Start here`, `Rules that outrank everything`, `Commands`, `Where things live`, `Conventions` and `Pitfalls`. It omits any section with nothing true to say. Reshaping your existing map file is a step of its own and moves sentences without rewriting them.

## Session review

Only you can start `session-review`. It reads one Claude Code transcript or Codex rollout, and on Claude Code its subagent transcripts.

A script lists calls that failed, were refused or returned large output. It also lists navigation candidates: a path that did not exist, a whole file read again, a read the host cut. Each comes with a possible cause.

The skill routes each finding to one place:

| Finding | Where it goes |
| --- | --- |
| A project fact | The map file |
| A fact about your machine | Your own global file, reported and never written |
| A mistake a machine could catch | A check to write; with a `.collet/` directory, a suggestion to run collet's `check-writer`, which it never runs |
| A long document | `repo-docs` |
| A structural problem | `repo-layout` |

A bug that came and went, or temporary output, gets no rule. You see each change with its transcript line and choose which to apply. Nothing is committed. Output is capped at 6 candidates (30 at most).

## Close-out

`closeout <session id or transcript file>` says whether deleting a finished Claude Code session would lose work. It only reports. It refuses the current session, and an id with no transcript or several.

A file the session wrote is safe when it is `tracked`, `ignored`, `untracked` or `outside` the repository. It is at risk when it is `tracked-missing`, `missing`, `outside-missing` or `unresolved`. A turn's text is at risk when it is `transcript-only`.

The skill drops throwaway helpers and status-only turns with a reason, and keeps plans, notes and decisions. It ends with `Safe to delete.` or `Deleting it would lose:` and the items.

A cleanup flag also names background commands and servers never seen ending, worktrees and branches never removed, and a missing `git status --ignored`.

## Repeated steps

`session-review all [sessions folder or transcript files]` lists steps many sessions repeated and writes nothing. In a Git work tree it finds Claude Code sessions (removed worktrees included) and Codex rollouts for the repository. It skips the running session.

A step matches by text after normalization. It is kept when it appears in at least 3 sessions (2 to 20), at most 10 per kind (1 to 30). The kinds are:

- Commands.
- Sequences of two or three.
- Lookups.
- Prompts you typed.
- Shared navigation candidates.

Each step says whether the map names it and whether a root `package.json` script runs it. The skill states how many sessions and dates it read.

It proposes nothing when a step needed judgement or the map names it. Otherwise it proposes one of these:

- A `Commands` line, when a script runs the step.
- The plain command or a short no-network, no-model script, plus its line.
- A path hint, for a repeated lookup.

A prompt repeated across repositories, a step for CI or a schedule, and a mistake a machine could catch are reported, never written. It applies only what you approve and commits nothing unless asked.

On Claude Code the pass also runs `session-tools.js`. Claude Code records the tool definitions and skill descriptions it sent each session. The script lists each one that at least 3 sessions were sent and none called, largest first, with its size in characters. A typed slash command and a subagent's call count as use. Tools of a tool server are counted, not listed.

It prints the lines you could paste into your own Claude Code settings: `permissions.deny` for tools, and `skillOverrides` with `name-only` for skills. Anneal never writes a settings file.

## Documentation

`repo-docs` inventories maintained documentation and reviews every README with its checker. It runs the layout audit without its migration. It checks claims, references, host instructions, setup and ignore rules against evidence.

Its report separates verified claims from unresolved ones, and static host checks from live execution. Changes to standing instructions need your authorization. Runtime, hook, permission and publishing changes are proposed separately.

### Readme

Modes: Write, Review (14 criteria scored 0 to 4, no changes), Improve and Edit. It never invents a command, output, URL or license.

`node scripts/readme-check.js [--tier minimal|standard|advanced] README.md` flags:

- Fences.
- A badge above the prose.
- A `$` prompt in a copy block.
- No shown result.
- Vague links.
- Filler.
- Long sentences.
- With `--tier`, more than 400, 900 or 1200 words.

It exits 1 while findings remain and judges no meaning.

### Pages for people

For a help page, guide, how-to, FAQ or changelog, the skill first settles the reader, task, entry point, product truth, language and house style. It labels any assumption. Its report names every label or limit it could not check.

### Adopt

After you approve each file, `adopt` writes:

- `.claude/rules/documentation.md`.
- A pointer line in each map file present. Codex and Antigravity skip `.claude/rules/`.
- For `solo-public`, ignore rules appended only where a private directory is not yet ignored.

It never untracks a file or ignores all of `docs/`, `docs/knowledge/` or `docs/apis/`, and commits nothing.

Profiles:

| Profile | What it does |
| --- | --- |
| `solo-public` | Ignores `docs/tasks/`, `docs/decisions/`, `docs/knowledge/private/`, `docs/apis/private/` and `.private/` |
| `private-repo` and `team` | Version every documentation directory for cloud sessions, with `.private/` still ignored; adopt writes no rule for it and reports a trackable one |

### Check and index

`node scripts/docs-check.js --root <project> [--json | --index]` reads every `docs` folder, ignored files included. It takes the profile from `.gitignore` files only, because a clone does not carry `.git/info/exclude`. It exits 1 on a high finding and 2 outside Git.

| Severity | Findings |
| --- | --- |
| High | `private-visible`, `public-ignored`, `tracked-private`, `public-links-private` |
| Medium | `task-note-large` (over 20,000 characters), `history-doc-large` (over 50,000), `task-note-completed` |
| Low | Frontmatter, type, folder, `related_files` and file-name problems |

The frontmatter reader handles top-level keys and `related_files`, not full YAML. `--index` prints `docs/index.md` text, one summary line per record grouped by type, listing only files Git does not ignore. You save it yourself.

### Maintain

`docs-maintenance.js` changes nothing. A group of proposals changes only after you approve it.

| Proposal | When it appears |
| --- | --- |
| `drift` and `drift-private` | A related file changed after the doc |
| `fold-completed` | A `status: completed` task note untouched for over three days; with transcripts, also unread by other sessions in that time |
| `condense` | An oversized record |
| `merge-per-entry` | Three or more docs sharing a name prefix |
| `fold-store` | A `--store` JSONL record with a `paths` list |

A file's date is its last commit, or its file time when untracked or uncommitted. A copy resets it, which can hide a proposal and never invents one. Task notes and decision records never drift. Only Claude Code transcripts are read.

### Memory

With `--memory <directory>`, or the project's Claude Code memory folder, `repo-docs` also reports:

| Finding | Meaning |
| --- | --- |
| `memory-index-orphan` | A `MEMORY.md` link finds no file |
| `memory-unindexed` | No link reaches the file, so no session loads it |
| `memory-missing-path` | A backticked path, `npm run` script, `--flag` or `[[name]]` link the project lacks |
| `memory-duplicate` | At least 40% of distinct words shared |
| `memory-stale-state` | Older than 14 days, with a word such as `still`, `now` or `pending` |

It never writes to the folder, and refuses one without `MEMORY.md`.

## Hooks

None of the hooks uses a model. The safety hook and instruction guard run on all three hosts. The session-start line has no Antigravity hook.

The guard watches `Write`, `Edit`, `MultiEdit` and `apply_patch` on Claude Code and Codex. On Antigravity it watches `write_to_file`, `replace_file_content`, `multi_replace_file_content`, `write_file` and `edit_file`. Antigravity CLI sends `write_file` for a created file and `edit_file` for an edit. The refusal on those two names is checked by tests, not by a live session.

### Safety hook

On a branch named `anneal/<YYYY-MM-DD>`, or a set-aside branch of it, the hook refuses commands that would discard the migration's commits or working tree:

- `reset --hard` and `clean -f`.
- Forced `checkout` or `switch`.
- `push --force` or a `+` refspec (`--force-with-lease` is allowed).
- `branch -D`.
- Forced moves onto the branch.
- `update-ref` or `push .` to it.

It also refuses commands that rewrite those commits: `commit --amend`, `rebase` except `--abort` and `--quit`, and `reflog expire`. It refuses commits or merges that skip the Git hooks: `--no-verify`, `-n` and `-c core.hooksPath`. A commit message containing `-n` or `--no-verify` is refused, so reword it.

On any other branch it asks before a command deletes, overwrites or moves a migration branch holding commits the checked-out branch lacks.

Codex's documentation says it parses the question but does not support it. There the hook refuses and you run the command yourself outside the session. Antigravity's documentation lists the question as a prompt. Neither answer has been observed live.

The hook matches command text, so git run through a variable escapes it.

### Instruction guard

In every session the guard refuses a file-tool write that puts invisible characters into a file agents load as instructions. It gives the audit finding's files and exceptions. To write about such a character, write its code point as text.

It does not see writes through a shell, such as `Set-Content` or a here-document. It refuses a byte order mark in an edit or patch even at the start of the file.

On Antigravity it reads every text argument, so an edit is refused when the text it replaces already holds such characters. Which arguments hold the new text is unchecked. A live refusal is unverified on every host.

### Session-start line

One line is added to what the agent reads first. For example:

```text
anneal: 2 completed task notes are still on disk: docs/tasks/12-login.md, docs/tasks/15-export.md. Fold each one's findings into its topic documents, then ask the owner before deleting it.
```

It names `status: completed` notes (count, up to ten paths) as soon as they are marked, and the record index or that there is none. It is silent when the project has no Markdown under a `docs/` folder, when the hook fails, or when `ANNEAL_SESSION_REPORT` turns it off. Whether a host passes the line to the agent is unverified.

## Script options

Anneal has no settings file or panel: you choose a skill and its mode. The one environment switch, `ANNEAL_SESSION_REPORT`, is in the README's [Settings](../../README.md#settings).

Besides `--root` and `--json` where a script prints JSON:

| Script | Options |
| --- | --- |
| `overview.js` | `--no-sessions` (the skill's `no-sessions`) |
| `audit.js` | `--global <file>` (repeatable; replaces your global files) and `--memory <file>` |
| `session-evidence.js` | `--before-line <line>`, `--before <time>` and `--limit <n>` (6; 30 at most) |
| `session-closeout.js` | `--session-id` or `--session-file` |
| `session-repeats.js` | `--sessions-dir`, `--session-file`, `--also-root`, `--min-sessions <2-20>` (3) and `--limit <1-30>` (10) |
| `session-tools.js` | `--sessions-dir`, `--session-file`, `--min-sessions <1-20>` (3) and `--limit <1-30>` (10) |
| `session-draft-check.js` | a file path, or the draft on standard input; it takes neither `--root` nor `--json` and always prints JSON |
| `docs-check.js` | `--index` |
| `docs-maintenance.js` | `--store`, `--transcripts` and `--memory` (repeatable) |
| `readme-check.js` | `--tier` |

The hooks also read `ANNEAL_HOST`, but only when the hook command carries no host name. The shipped hook files always carry one, so there is nothing to set.


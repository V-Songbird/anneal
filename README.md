# anneal

**Help coding agents find their way around an existing project.**

Available on [Claude Code](#claude-code), the primary host, and on the compatibility hosts [Codex](#codex) and [Antigravity](#antigravity).

[Get started](#install) · [What is this?](#what-is-this) · [How it works](#how-it-works) · [What you can do](#what-you-can-do) · [Evidence](#the-numbers)

## What is this?

An agent opens your project to change how a discount is computed. Three packages have a discount function, nothing says which one the checkout uses, and the agent reads two wrong ones first. The next session does the same. This example illustrates the problem; the measurements below describe specific recorded runs.

anneal looks for what makes an agent search, read or guess more than it needs to. It audits the project's layout, reviews session detours, finds steps sessions repeat that a plain script could run, and aligns documentation with current behavior. It has three skills for those tasks and a fourth, `overview`, that says which to run. Use it on an existing project; a rename or new scaffold needs none of it.

## Why you'd want it

- See what slows an agent down in your project, with counts and example paths.
- Give each session a short map instead of a search.
- Turn a step sessions keep repeating into one command.
- Keep documentation and agent instructions in line with what the code does.
- Change nothing without your approval.

## How it works

Each skill runs a script that reads your repository or a session transcript, then reports. The scripts use no model, write nothing and are dependency-free Node.js. No command edits a project on its bare name: `overview` and both audits report, `repo-layout` and `session-review` propose and wait for your approval of each step, and `repo-docs` applies ordinary fixes only with `fix` or a cleanup request in your own words. Findings are heuristics, none verified. An audit saves a file only after you say yes; a run nobody can answer, such as a headless one, writes nothing.

**Overview.** Two lines per part (navigation, documentation, past sessions, this session): what that part's script counted, and the skill to run next. A part whose script cannot run shows `not available`. On the repository anneal was developed in, a run took about 20 seconds, most of it reading 71 sessions.

**Layout audit.** Findings by severity:

| Severity | Findings |
| --- | --- |
| High | `map-file-missing` (no `CLAUDE.md`, `AGENTS.md` or `GEMINI.md`, at the root or in `.claude/`, `.agents/` or `.gemini/`); `check-command-missing`; `build-output-not-ignored`; `not-a-git-repo` |
| Medium | `map-file-long` (over 200 lines); `toolchain-version-missing`; `env-template-missing`; `duplicate-names`; `generic-names`; `large-files` (over 800 lines); `build-output-tracked` |
| Low | `index-files` (three or more); `deep-nesting` (six folders or more); `runtime-names`; `default-exports`; `re-export-files`; `check-command-split`; `instruction-hidden-characters` |

`instruction-hidden-characters` reads every `CLAUDE.md`, `AGENTS.md` and `GEMINI.md`, and the `.md` and `.mdc` files under `.agents/`, `.claude/`, `.cursor/rules/` and `.gemini/`. It reports zero-width characters, bidi controls, variation selectors, a byte order mark past the start and Unicode tags, with file, line and code point (tags are only counted, since their code points spell the hidden text). It skips what renders on screen, such as the joiner inside an emoji, and leaves a zero-width non-joiner in a script that needs it to you. `repo-layout` never removes the characters. Observations with no severity follow: what each map file names, which packages it reaches, long documents, tracked `dist/` folders that may hold source, and fixtures that look generated.

The summary ends with a `start context` block: the characters a Claude Code session reads before its first prompt, against a 20,000-character budget. It counts the root `CLAUDE.md`, `.claude/CLAUDE.md` and `CLAUDE.local.md` with their `@path` imports, `.claude/rules/` files with no `paths:` key, your global `CLAUDE.md`, and the project's `MEMORY.md` counted whole, so the total is an upper bound; your Codex global `AGENTS.md` gets a line outside the total. Past the budget, the last line says by how much; the audit proposes no edit. When your global files alone pass a quarter of it, a pointer names two ways Claude Code loads text later: a `.claude/rules/` file with `paths:` globs, and a hook that returns `additionalContext`. An `instruction drift` block lists the list items your Claude Code and Codex global files (or every `--global` file) do not share, leaving out items that name a host; which copy is right is yours to decide. A `memory left behind` block names other Claude Code project folders whose transcripts name this repository, since a moved repository starts with no memory; the audit moves no file.

At the root, a check command is a `package.json` script such as `test`, `lint` or `check`, a `Makefile` target or `justfile` recipe so named, a `scripts/` Node script, a harness runner such as collet's, a build tool's own check (`cargo test`, `go test ./...`, `dotnet test`, Gradle, Maven, `tox`, `nox`, `pytest`), or `node --test` when there is no `package.json` or `.gitmodules`. Manifests below the root, CI-only steps, Unity tests and commands only prose names do not count.

**Migration.** It runs your project's checks once first, so an earlier failure is never blamed on a later step. For generic or duplicate names, large files, deep nesting or re-exports, the read-only `mapper` helper proposes which files belong together, and you approve, trim or skip. Approved steps land one commit each on the branch `anneal/<YYYY-MM-DD>`, cut from your `HEAD`; a branch of that name elsewhere stops the run. A step that breaks a check is fixed or set aside on its own branch. It stops, leaving your branch as it was, when `git status --porcelain` prints anything, the repository has no commit, or `git config user.email` is empty. The map file it writes has the sections `Start here`, `Rules that outrank everything`, `Commands`, `Where things live`, `Conventions` and `Pitfalls`, omitting any with nothing true to say; reshaping your existing map file is a step of its own and moves sentences without rewriting them. On the Claude Code version it ran on, Auto is the default permission mode (`claude --permission-mode manual` lets you answer each prompt); answering No ends the turn, and a denied compound command does not say which part you refused, so name it. While `mapper` runs in the background the input looks idle and the session goes on by itself (45 seconds on a nine-file repository).

**Session review.** Only you can start `session-review`. It reads one Claude Code transcript or Codex rollout, and on Claude Code its subagent transcripts. A script lists calls that failed, were refused or returned large output, and navigation candidates (a path that did not exist, a whole file read again, a read the host cut), each with a possible cause. The skill routes each finding to one place: a project fact to the map file; a fact about your machine to your own global file, reported and never written; a mistake a machine could catch to a check to write (with a `.collet/` directory, a suggestion to run collet's `check-writer`, which it never runs); a long document to `repo-docs`; a structural problem to `repo-layout`. A bug that came and went, or temporary output, gets no rule. You see each change with its transcript line and choose which to apply; nothing is committed. Output is capped at 6 candidates (30 at most).

**Close-out.** `closeout <session id or transcript file>` says whether deleting a finished Claude Code session would lose work, and only reports. It refuses the current session, and an id with no transcript or several. A file the session wrote is safe when `tracked`, `ignored`, `untracked` or `outside` the repository, and at risk when `tracked-missing`, `missing`, `outside-missing` or `unresolved`. A turn's text is at risk when `transcript-only`. The skill drops throwaway helpers and status-only turns with a reason, keeps plans, notes and decisions, and ends with `Safe to delete.` or `Deleting it would lose:` and the items. A cleanup flag also names background commands and servers never seen ending, worktrees and branches never removed, and a missing `git status --ignored`.

**Repeated steps.** `session-review all [sessions folder or transcript files]` lists steps many sessions repeated and writes nothing. In a Git work tree it finds Claude Code sessions (removed worktrees included) and Codex rollouts for the repository, and skips the running session. A step matches by text after normalization and is kept when it appears in at least 3 sessions (2 to 20), at most 10 per kind (1 to 30): commands, sequences of two or three, lookups, prompts you typed and shared navigation candidates. Each says whether the map names it and whether a root `package.json` script runs it. The skill states how many sessions and dates it read, and proposes nothing when a step needed judgement or the map names it; a `Commands` line when a script runs it; otherwise the plain command or a short no-network, no-model script plus its line; a path hint for a repeated lookup. A prompt repeated across repositories, a step for CI or a schedule, and a mistake a machine could catch are reported, never written. It applies only what you approve and commits nothing unless asked.

**Documentation.** `repo-docs` inventories maintained documentation, reviews every README with its checker, runs the layout audit without its migration, and checks claims, references, host instructions, setup and ignore rules against evidence. Its report separates verified claims from unresolved ones, and static host checks from live execution. Changes to standing instructions need your authorization; runtime, hook, permission and publishing changes are proposed separately.

- **Readme.** Write, Review (14 criteria scored 0 to 4, no changes), Improve and Edit modes; it never invents a command, output, URL or license. `node scripts/readme-check.js [--tier minimal|standard|advanced] README.md` flags fences, a badge above the prose, a `$` prompt in a copy block, no shown result, vague links, filler, long sentences and, with `--tier`, more than 400, 900 or 1200 words; it exits 1 while findings remain and judges no meaning.
- **Pages for people.** For a help page, guide, how-to, FAQ or changelog, it first settles the reader, task, entry point, product truth, language and house style, labelling any assumption, and its report names every label or limit it could not check.
- **Adopt.** After you approve each file, it writes `.claude/rules/documentation.md`, a pointer line in each map file present (Codex and Antigravity skip `.claude/rules/`) and, for `solo-public`, ignore rules appended only where a private directory is not yet ignored. It never untracks a file or ignores all of `docs/`, `docs/knowledge/` or `docs/apis/`, and commits nothing. Profiles: `solo-public` ignores `docs/tasks/`, `docs/decisions/`, `docs/knowledge/private/`, `docs/apis/private/` and `.private/`; `private-repo` and `team` version every documentation directory for cloud sessions, with `.private/` still ignored (adopt writes no rule for it, and reports a trackable one).
- **Check and index.** `node scripts/docs-check.js --root <project> [--json | --index]` reads every `docs` folder, ignored files included, takes the profile from `.gitignore` files only (a clone does not carry `.git/info/exclude`), and exits 1 on a high finding, 2 outside Git. High: `private-visible`, `public-ignored`, `tracked-private`, `public-links-private`. Medium: `task-note-large` (over 20,000 characters), `history-doc-large` (over 50,000), `task-note-completed`. Low: frontmatter, type, folder, `related_files` and file-name problems. The frontmatter reader handles top-level keys and `related_files`, not full YAML. `--index` prints `docs/index.md` text, one summary line per record grouped by type, listing only files Git does not ignore; you save it yourself.
- **Maintain.** `docs-maintenance.js` changes nothing, and a group of proposals changes only after you approve it. `drift` and `drift-private`: a related file changed after the doc. `fold-completed`: a `status: completed` task note untouched for over three days (with transcripts, also unread by other sessions in that time). `condense`: an oversized record. `merge-per-entry`: three or more docs sharing a name prefix. `fold-store`: a `--store` JSONL record with a `paths` list. A file's date is its last commit, or its file time when untracked or uncommitted; a copy resets it, which can hide a proposal and never invents one. Task notes and decision records never drift. Only Claude Code transcripts are read.
- **Memory.** With `--memory <directory>`, or the project's Claude Code memory folder, it also reports `memory-index-orphan` (a `MEMORY.md` link finds no file), `memory-unindexed` (no link reaches the file, so no session loads it), `memory-missing-path` (a backticked path, `npm run` script, `--flag` or `[[name]]` link the project lacks), `memory-duplicate` (at least 40% of distinct words shared) and `memory-stale-state` (older than 14 days, with a word such as `still`, `now` or `pending`). It never writes to the folder, and refuses one without `MEMORY.md`.

**Hooks.** None uses a model.

The safety hook and instruction guard run on all three hosts; the session-start line has no Antigravity hook. The guard watches `Write`, `Edit`, `MultiEdit` and `apply_patch` on Claude Code and Codex, and `write_to_file`, `replace_file_content` and `multi_replace_file_content` on Antigravity.

- **Safety hook.** On a branch named `anneal/<YYYY-MM-DD>`, or a set-aside branch of it, it refuses commands that would discard the migration's commits or working tree: `reset --hard`, `clean -f`, forced `checkout` or `switch`, `push --force` or a `+` refspec (`--force-with-lease` is allowed), `branch -D`, forced moves onto the branch, and `update-ref` or `push .` to it. It also refuses commands that rewrite those commits (`commit --amend`, `rebase` except `--abort` and `--quit`, `reflog expire`) and commits or merges that skip the Git hooks (`--no-verify`, `-n`, `-c core.hooksPath`); a commit message containing `-n` or `--no-verify` is refused, so reword it. On any other branch it asks before a command deletes, overwrites or moves a migration branch holding commits the checked-out branch lacks. Codex's documentation, read on 2026-11-14, says it parses the question but does not support it, so there the hook refuses and you run the command yourself outside the session; Antigravity's documentation, read the same day, lists the question as a prompt. Neither answer was observed live. It matches command text, so git run through a variable escapes it.
- **Instruction guard.** In every session it refuses a file-tool write that puts invisible characters into a file agents load as instructions, with the audit finding's files and exceptions. To write about such a character, write its code point as text. It does not see writes through a shell, such as `Set-Content` or a here-document, and refuses a byte order mark in an edit or patch even at the start of the file. On Antigravity it reads every text argument, so an edit is refused when the text it replaces already holds such characters, and which arguments hold the new text is unchecked. A live refusal is unverified on every host.
- **Session-start line.** One line added to what the agent reads first, such as `anneal: 2 completed task notes are still on disk: docs/tasks/12-login.md, docs/tasks/15-export.md. Fold each one's findings into its topic documents, then ask the owner before deleting it.` It names `status: completed` notes (count, up to ten paths) as soon as they are marked, and the record index or that there is none. It is silent when the project has no Markdown under a `docs/` folder, when the hook fails, or when `ANNEAL_SESSION_REPORT` turns it off. Whether a host passes the line to the agent is unverified.

## What you can do

Examples use Claude Code syntax. On Codex use `$<skill-name>`; on Antigravity use `/<skill-name>`.

| Task | Request |
| --- | --- |
| See what anneal finds and which skill to run next | `/anneal:overview` (Codex `$overview`, Antigravity `/overview`) |
| Audit without edits | `/anneal:repo-layout audit` |
| Plan a migration and approve each step | `/anneal:repo-layout` |
| Propose instruction changes from one session | `/anneal:session-review [transcript file]` |
| Check whether deleting a finished session would lose work | `/anneal:session-review closeout <session id or transcript file>` |
| Find what many sessions repeat | `/anneal:session-review all [sessions folder or transcript files]` |
| Report where documentation disagrees with current behavior | `/anneal:repo-docs` |
| Apply fixes, trim, adopt a policy, or work on one README | `/anneal:repo-docs [fix\|maintain\|adopt\|readme] [path or concern]` |

You can also run the scan directly, from the plugin folder or a clone of this repository; `--json` adds the evidence behind each count:

```shell
node scripts/audit.js --root "<your-repository>"
```

### Settings

anneal has no settings file or panel: you choose a skill and its mode.

| Setting | Values | Effect |
| --- | --- | --- |
| `ANNEAL_SESSION_REPORT` | `off`, `0` or `false` | Turns off the session-start line. Set it in the `env` block of Claude Code's `settings.json` or in the shell that starts the host; a running host does not pick up a new shell. Any other value leaves it on |
| `CLAUDE_CONFIG_DIR`, `CODEX_HOME`, `CLAUDE_PROJECT_DIR` | a folder | Read as the host sets them, not anneal settings: the homes (defaults `~/.claude`, `~/.codex`) for global files, memory and transcripts, and the project the session-start line reads (default the working folder, or the top of its Git tree) |

The hooks also read `ANNEAL_HOST`, but only when the hook command carries no host name, which the shipped hook files always do, so there is nothing to set.

Script options, besides `--root` and `--json` where a script prints JSON: `overview.js --no-sessions` (the skill's `no-sessions`); `audit.js --global <file>` (repeatable; replaces your global files) and `--memory <file>`; `session-evidence.js --before-line <line>`, `--before <time>` and `--limit <n>` (6; 30 at most); `session-closeout.js --session-id` or `--session-file`; `session-repeats.js --sessions-dir`, `--session-file`, `--also-root`, `--min-sessions <2-20>` (3) and `--limit <1-30>` (10); `docs-check.js --index`; `docs-maintenance.js --store`, `--transcripts` and `--memory` (repeatable); `readme-check.js --tier`.

## Install

anneal is one package for Claude Code, Codex and Antigravity. Install it in the one you use. Every host needs Node.js 22 or later; confirm `node --version`. A migration also needs a Git repository with a commit, a clean working tree, and `git config user.email` set; audit mode does not.

### Claude Code

Requirements: Node.js 22 or later, Git and Claude Code 2.1.323 or later.

```text
/plugin marketplace add V-Songbird/foundry
/plugin install anneal@foundry
```

Start a new session. In a terminal, `claude plugin list` names `anneal` once installed.

### Codex

Requirements: Node.js 22 or later, Git and a Codex host with plugin support.

```text
codex plugin marketplace add V-Songbird/foundry
codex plugin add anneal@foundry
```

Before guarded work, open `/hooks` in Codex CLI and review and trust the plugin's `SessionStart` hook and its two `PreToolUse` hooks. Codex's documentation says a changed hook definition or hook script needs another review; see [Codex hook trust](https://learn.chatgpt.com/docs/hooks#review-and-trust-hooks). Then start a new Codex session.

### Antigravity

Requirements: Node.js 22 or later, Git and the Antigravity CLI. Antigravity has no marketplace for third-party plugins, so install anneal from a clone of Foundry, which checks anneal out at the commit the other catalogs pin. Replace `<path-to-clone>` with the directory to clone into:

```shell
git clone --recurse-submodules https://github.com/V-Songbird/foundry.git <path-to-clone>
agy plugin install <path-to-clone>/anneal
agy plugin list
```

The list names `anneal`; if it does not, run the install again with the clone path. Start a new conversation. With `--sandbox`, headless `agy` runs no shell command.

### Update

In Claude Code, refresh the marketplace, update the plugin and start a new session:

```text
/plugin marketplace update foundry
/plugin update anneal@foundry
```

In Codex, refresh the marketplace, add the plugin again, review any changed hook in `/hooks` and start a new session:

```text
codex plugin marketplace upgrade
codex plugin add anneal@foundry
```

An Antigravity install is a copy, so it stays at its commit. Update the clone, install again and start a new conversation:

```shell
git -C <path-to-clone> pull
git -C <path-to-clone> submodule update --init
agy plugin install <path-to-clone>/anneal
```

## Good to know

> **Experimental.** No support or stability promise. It can change or disappear without a migration path.

- Findings are heuristics; framework conventions and project instructions take precedence. A flagged `index` file may be what your framework expects.
- When Git cannot read an ignore file, such as a global excludes file a sandbox denies, the audit names it in a `limitation:` line, and a folder only that file ignores shows in `build-output-not-ignored`, which still holds for a clone.
- Observations match the paths a map names, not what its sentences mean: "the pricing package" without a path counts as not named. Headings are read in Markdown only.
- Import rewriting covers relative imports and `require()` in JavaScript and TypeScript family files (`.js`, `.ts`, `.vue`, `.svelte` and variants). Aliases, other languages, config files and documents are found by searching and need review, and code that builds names at runtime is reported, never rewritten. Moving files collides with branches others have open; migrate when few are.
- A session audit reads one session, so "repeated" means repeated inside it, and a cause rests on names, paths and order alone: a later file with the same name can be another file. The many-sessions pass matches text, so two commands doing one job in different words are two steps; it lists without judging, and most repeated reads are ordinary work. A command is cut at 480 characters, a prompt key at 120. It finds Claude Code and Codex sessions on its own and reads on Antigravity, which has no known transcript location, only files you hand it. Codex discovery is held by fixtures only, and the pass has run only in eval cases through the Agent SDK, not interactively. The overview has not run live on any host.
- Transcript parsing depends on formats covered by tests, so a host format change can break it. On Codex, a result with no exit code takes its outcome from wrappers and records current rollouts show; scripts are read by pattern, so a call built at run time reads `unknown` and a failure dropped in an unusual way can read `ok`. Shell recognition is small: an unknown pipeline, substitution or redirect counts as mixed. Output rewritten by a plugin or hook leaves a marker the evidence cannot tell from the tool's own output.
- Close-out reads Claude Code transcripts only, does not read subagent records and saved outputs, counts a turn as held when it wrote any tracked or ignored file even if unrelated, and lists no file a shell command changed. Its cleanup flag misses a process started with `&` and git commands inside a here-document.
- Redaction of credentials, your home directory and your account name is best effort, and the session file path is copied unredacted. Read an excerpt before you share it.
- Documentation checks cover the stated evidence, do not prove every claim, host or distribution safe, and do not scan Git history.
- A complete migration, with the Git guard's refusal on its branch, has been observed in interactive sessions on Claude Code (a script answering the prompts) and the Antigravity IDE (a person answering). On Codex CLI it was observed with a script answering and the project's `.git` added as a writable root (`codex exec --add-dir <project>/.git`, since `workspace-write` keeps `.git` read-only); that plan only changed the map file, so a migration that moves files is unverified on Codex.
- The audits and session review have run in Claude Code, headless Codex CLI and headless Antigravity CLI without `--sandbox`; a repo-layout audit has run in the Antigravity IDE and the Codex desktop app, and its other flows are unverified. On Antigravity CLI, `agy plugin list` names `anneal` after installation.

## The numbers

Each result belongs to the named model and recorded run. Missing measurements remain marked as unmeasured. The raw records are kept outside this repository.

### Claude Code results

The first two tables compare two map files, not sessions with and without anneal: no session in them loaded the plugin. They test a `Start here` line that points an agent at the right package or contract section.

<!-- foundry:evidence {"platform":"Claude","status":"measured","models":["Claude Opus 5"],"date":"unknown","dateReason":"The run date is not recorded.","revision":"not recorded","revisionReason":"The commit the run used is not recorded.","reviewedAt":"2026-11-16"} -->
| Model | Map file | Correct runs | Contract characters read | Contract task cost |
| --- | --- | --- | --- | --- |
| Claude Opus 5 | Original | 6/6 | About 123,000 | $1.10 |
| Claude Opus 5 | With two `Start here` lines | 6/6 | About 31,000 | $0.68 |

Paired navigation runs: Claude Code under WSL2 with `claude-opus-5[1m]`, twelve runs, three tasks by two map files by two fresh sessions. The arms did not differ in correctness. Characters and list-price cost cover the two contract-task runs per arm; those with the lines took 58 seconds against 45. In the package lookup the original runs opened three decoy files and the others one. In the control task, which needs no orientation, the lines cost 244 characters and the oriented runs used 8 tool calls against 11. Two runs per arm cannot tell a small effect from noise.

<!-- foundry:evidence {"platform":"Claude","status":"measured","models":["Claude Opus 5"],"date":"unknown","dateReason":"The run date is not recorded.","revision":"not recorded","revisionReason":"The commit the run used is not recorded.","reviewedAt":"2026-11-16"} -->
| Model | Map file | Correct runs | Contract characters read | Contract task cost |
| --- | --- | --- | --- | --- |
| Claude Opus 5 | Original | 6/6 | About 123,000 | $1.18 |
| Claude Opus 5 | With two `Start here` lines | 6/6 | About 17,000 | $0.57 |

Held-out checks: the same protocol, host and model on a second repository with another layout and contract, twelve runs. The contract task took about 45 seconds in each arm. In the package lookup one original run opened two decoy files and the runs with the lines opened none. The lines cost 238 characters, and the oriented control runs used 8 tool calls against 10.

<!-- foundry:evidence {"platform":"Claude","status":"measured","models":["Claude Opus 5"],"date":"unknown","dateReason":"The run date is not recorded.","revision":"not recorded","revisionReason":"The commit the run used is not recorded.","reviewedAt":"2026-11-16"} -->
| Model | Case | Score with anneal | Score without |
| --- | --- | --- | --- |
| Claude Opus 5 | `audit-reports-without-changes` | 1.00 | 0.93 |
| Claude Opus 5 | `migration-stops-on-uncommitted-work` | 1.00 | 0.83 |
| Claude Opus 5 | `session-audit-proposes-without-writing` | 1.00 | 0.75 |

Three cases, three runs per arm, 18 sessions, on Claude Code with its default model `claude-opus-5`, about 13 minutes at a list-price estimate near $5. Plugin-dependent graders are indicators, left out of the score. Reply graders passed 17 of 18 times without the plugin. The session case's difference comes from one grader that passed in all three runs with the plugin and none without. Three runs per arm is a small sample.

Smaller runs, on Claude Code under WSL2, three runs per arm unless noted:

- An unreadable transcript (2026-09-23, model not recorded), one record cut: every run named the refusal. With anneal each stopped there and scored 1.00 (estimate $1.53); without it each read the file itself and still proposed a command from the refused part, scoring 0.75.
- A map read with no code session (2026-09-23, model not recorded, no baseline arm): the map with `Start here` lines answered all four questions in every run (estimate $1.16); the original answered `not in the notes` for the package and section (estimate $0.38). Both scored 1.00.
- One approved migration step with `claude-opus-5[1m]`, one run per arm, date not recorded: $0.58 and 66 seconds with anneal, $0.27 and 22 seconds without.

<!-- foundry:evidence {"platform":"Claude","status":"measured","models":["Claude Opus 5.5"],"date":"2026-11-09","revision":"not recorded","revisionReason":"The commit the run used is not recorded.","reviewedAt":"2026-11-16"} -->
| Model | Case | Grader | With anneal | Without |
| --- | --- | --- | --- | --- |
| Claude Opus 5.5 | `session-audit-keeps-a-machine-fact-out` | `machine-fact-for-the-global-file` | 3/3 | 1/3 |
| Claude Opus 5.5 | `session-audit-suggests-check-writer-with-collet` | `check-writer-suggested` | 3/3 | 0/3 |
| Claude Opus 5.5 | `readme-repair-without-the-word` | `node-before-install` | 3/3 | 1/3 |
| Claude Opus 5.5 | `readme-repair-without-the-word` | `no-copy-prompt` | 3/3 | 2/3 |
| Claude Opus 5.5 | `readme-review-reports-without-changes` | `names-badge-order` | 3/3 | 1/3 |
| Claude Opus 5.5 | `writing-page-without-the-word` | `node-before-install` | 3/3 | 0/3 |
| Claude Opus 5.5 | `plan-flags-a-wrong-importer-count` | `stale-row-flagged` | 3/3 | 1/3 |
| Claude Opus 5.5 | `plan-flags-a-wrong-importer-count` | `stale-row-not-planned` | 3/3 | 0/3 |

The first SDK baseline, on 2026-11-09: 15 cases, three runs with anneal and three without, on `claude-opus-5-5` through the Claude Agent SDK rather than a Claude Code session, with judged graders on `claude-sonnet-5-5`. The table lists every outcome grader where the arms differed, in six cases. With anneal, 13 of 15 cases passed every grader in all three runs. Four cases passed their outcome graders in every run of both arms, so they show nothing for the plugin until hardened. Graders that read anneal's own evidence output fail without the plugin by construction and are left out. Three runs per arm are exploratory.

Two cases did not pass every grader with the plugin. A help-page review scored a reply grader 1 of 3 with the plugin and 3 of 3 without, though every run in both arms named both planted defects. A migration into a new directory stopped in every run with the plugin because the session had no Git identity, which the runner now supplies. A rerun of both migration cases on 2026-11-09, same runner and model, three runs per arm, cost an estimated $1.32: with the plugin every run created the branch, moved the file, rewrote both imports and committed; without it none created the branch or an `anneal:` commit.

### Codex results

<!-- foundry:evidence {"platform":"Codex","status":"pending","reason":"No Codex performance measurements are available."} -->
| Model | Setup | Correct runs | Contract characters read |
| --- | --- | --- | --- |
| Not measured | Not measured | Not measured | Not measured |

No Codex session has been measured yet.

### Antigravity results

<!-- foundry:evidence {"platform":"Antigravity","status":"pending","reason":"No Antigravity performance measurements are available."} -->
| Model | Setup | Correct runs | Contract characters read |
| --- | --- | --- | --- |
| Not measured | Not measured | Not measured | Not measured |

No Antigravity session has been measured yet.

## What changed

Release notes for every version are on the [releases page](https://github.com/V-Songbird/anneal/releases).

## License

MIT — see [LICENSE](LICENSE).

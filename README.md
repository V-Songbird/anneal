# anneal

**Help coding agents find their way around an existing project.**

Available on [Claude Code](#claude-code), the primary host, and on the compatibility hosts [Codex](#codex) and [Antigravity](#antigravity).

[Get started](#install) · [What is this?](#what-is-this) · [How it works](#how-it-works) · [What you can do](#what-you-can-do) · [Evidence](#the-numbers)

## What is this?

An agent opens your project to change how a discount is computed. Three packages have a discount function, nothing says which one the checkout uses, and the agent reads two wrong ones first. The next session does the same. This example illustrates the problem; the measurements below describe specific recorded runs.

anneal looks for what makes an agent search, read or guess more than it needs to. It audits the project's layout, reviews session detours, finds steps sessions repeat that a plain script could run, and aligns documentation with current behavior. It has three skills for those tasks and a fourth that says which to run.

Use it on an existing project. A single rename or a new scaffold needs none of it.

## Why you'd want it

- See what slows an agent down in your project, with counts and example paths.
- Give each session a short map instead of a search.
- Turn a step sessions keep repeating into one command.
- Keep documentation and agent instructions in line with what the code does.
- Change nothing without your approval.

## How it works

Each skill runs a script that reads your repository or a session transcript, then reports what it found. The scripts use no model, write nothing and are dependency-free Node.js. A change is proposed and waits for your yes. No anneal command edits a project on its bare name: `overview` and both audits report, `repo-layout` and `session-review` propose and wait for your approval of each step or entry, and `repo-docs` applies ordinary fixes only with `fix` or a cleanup request in your own words. Findings are heuristics, none of them verified.

### The overview

`overview` runs one read-only script and prints two lines for each part of anneal: what that part's own script counted, and the skill to run next.

| Part | What it counts | Skill it names |
| --- | --- | --- |
| Navigation | The layout audit's findings | `repo-layout audit`, when there is a finding, no map file or a start context over its budget |
| Documentation | The documentation check's findings and the maintenance proposals | `repo-docs audit` for findings, `repo-docs maintain` for proposals, `repo-docs adopt` when `docs/` holds no maintained record |
| Past sessions | The repeated-step search | `session-review all`, when a repeated step is not named in the map or sessions share a navigation finding |
| This session | Nothing | `session-review`, which only you can start |

A script that cannot run, such as the documentation check outside Git or the session search with no session to read, leaves its part as `not available` with that script's own message. On the repository anneal was developed in, a run took about 20 seconds, most of it reading 71 sessions. The overview has not run live on any host.

### The layout audit

An `audit` run shows the findings, offers to save them and writes a findings, report or notes file only after you say yes, even when your own instructions ask to save findings. A run nobody can answer, such as a headless one, writes nothing, and the audit saves no copy of its own output anywhere else.

| Severity | Finding | What it means |
| --- | --- | --- |
| high | `map-file-missing` | No `CLAUDE.md`, `AGENTS.md` or `GEMINI.md`, at the root or in `.claude/`, `.agents/` or `.gemini/`, so every session starts by exploring |
| high | `check-command-missing` | No test or check command found |
| high | `build-output-not-ignored` | Build or dependency folders that Git does not ignore, so they fill search results |
| high | `not-a-git-repo` | Search cannot use `.gitignore` to skip generated files |
| medium | `map-file-long` | A map file over 200 lines, loaded into every session |
| medium | `toolchain-version-missing` | No `.nvmrc`, `.python-version` or equivalent |
| medium | `env-template-missing` | Environment files with no `.env.example` naming the variables |
| medium | `duplicate-names` | One file name used more than once, so a search by name is ambiguous |
| medium | `generic-names` | `utils`, `helpers`, `common` and the rest, which say nothing about the contents |
| medium | `large-files` | Code files over 800 lines, expensive to read whole |
| medium | `build-output-tracked` | Generated files committed to Git, outside the input folders that `required-inputs` reports |
| low | `index-files` | Three or more files named `index` |
| low | `deep-nesting` | Code six or more folders down |
| low | `runtime-names` | Names assembled at runtime, which search cannot follow |
| low | `default-exports` | Default exports, which can be imported under another name |
| low | `re-export-files` | Index files that only re-export, adding a hop to every lookup |
| low | `check-command-split` | Checks exist, but no single command runs them all |
| low | `instruction-hidden-characters` | Characters a model reads and a person does not see, in a file agents load as instructions |

After the findings come observations, which have no severity and ask for no change on their own: `map-routes` (what each map file names and whether it names a check command), `package-routes` (which packages the map reaches), `document-sections` (long documents and their headings), `package-local-names`, `framework-paths`, `source-dist` (tracked `dist/` folders that may hold source) and `required-inputs` (committed fixtures that look generated). `repo-docs` starts its task routes from them.

**Hidden characters.** The finding reads every `CLAUDE.md`, `AGENTS.md` and `GEMINI.md` at any depth, and the `.md` and `.mdc` files under `.agents/`, `.claude/`, `.cursor/rules/` and `.gemini/`. It reports zero-width characters, the word joiner, a byte order mark past the first character, bidi controls, variation selectors, Mongolian free variation selectors and Unicode tags, each with its file, line and code point; tags are only counted, because their code points spell out hidden text. What renders on screen is not reported: the joiner inside an emoji, the tags of a subdivision flag, an emoji presentation selector after an emoji or a keycap, and Mongolian selectors after a Mongolian letter. A zero-width non-joiner in a script that needs it is reported and left to you. `repo-layout` never removes the characters.

**What every session loads.** The summary ends with a `start context` block: the characters a Claude Code session reads before its first prompt. It counts the root `CLAUDE.md`, `.claude/CLAUDE.md` and `CLAUDE.local.md` with their `@path` imports (up to five hops), the `.md` files under `.claude/rules/` that have no `paths:` key, your global `CLAUDE.md` with its imports, and the project's `MEMORY.md` index counted whole, so the count is an upper bound. Each file counts once. Your Codex global `AGENTS.md` gets its own line, marked as outside the Claude Code total. The budget is 20,000 characters, and each line shows its share. Over it, the last line says by how much and that cuts would start with the largest sources. The audit proposes no edit. A `hook text` table sums the text hooks added in your latest Claude Code transcript, by hook command and event, without the text itself. A `SessionStart` hook in `.claude/settings.json` is listed with its command and never run. A global or memory file that does not exist, or an import that does not resolve, appears as a `missing` line.

When your global files alone are over a quarter of the budget, the block adds a pointer to the two ways Claude Code loads text later: a rule under `.claude/rules/` with `paths:` globs, and a hook that returns `additionalContext` only for a matching tool call. Choosing which lines to move is yours.

**Whether your hosts' global files agree.** An `instruction drift` block compares your Claude Code and Codex global files, or every file you pass with `--global`. It lists under `only in <file>` each list item that no other file has, leaving out items that name a host, and shows them redacted. It only reports; which copy is right is yours to decide.

**Memory left behind by a move.** Claude Code keys a project's memory by folder path, so a moved or renamed repository starts with none. When no memory folder holds a `.md` file, the audit looks in the other project folders for one whose transcripts name this repository, by Git remote or by path, and lists it in a `memory left behind` block. A folder whose sessions only mention the repository is listed too. The audit moves no file.

**Where the audit finds a check command.** These count: a `package.json` script named `test`, `lint`, `typecheck`, `check`, `verify`, `validate` or `ci` (not a `watch`, `fix`, `update` or `debug` variant), a `Makefile` target or `justfile` recipe starting with those words, a Node script of one of those names in the root `scripts/` folder, the check runner of a harness such as collet's `node .collet/checks/run.mjs`, a build tool's own check (`cargo test`, `go test ./...`, `dotnet test`, Gradle, Maven, `tox`, `nox` or `pytest` with root configuration), and `node --test` when the root has no `package.json` or `.gitmodules` and Node finds test files. These do not count: a manifest or Makefile below the root, steps only a CI workflow runs, Unity Test Framework tests, and a command that only a map file or README names.

### A migration

1. The audit runs and you read the findings.
2. Your project's own checks run once, so a failure that was already there is never blamed on a later step.
3. When the audit reports generic or duplicate names, large files, deep nesting or re-export files, the read-only `mapper` helper proposes which files belong together. You approve, trim or skip that proposal.
4. anneal creates the branch `anneal/<YYYY-MM-DD>` from your current `HEAD`, or switches to it when it already points there. A branch of that name that points anywhere else stops the run.
5. Each approved step makes one change, reruns the checks and lands one commit. A step that breaks a check is either fixed or set aside on its own branch, and you are told which.
6. The audit runs again, so you see what changed beside what did not.

anneal stops before step 2 when `git status --porcelain` prints anything, when the repository has no commit, or when `git config user.email` prints nothing. The branch you were on is left exactly as it was.

The map file anneal writes carries the same sections in the same order: `Start here`, `Rules that outrank everything`, `Commands`, `Where things live`, `Conventions`, `Pitfalls`. A section with nothing true to say is left out. When your map file is off that order, the reshape is a step of its own; it moves sentences without rewriting them and lists anything that would leave the file before you approve. Before a step is committed its diff is read, and a line that states an instruction no approved step holds is removed and reported.

On Claude Code 2.1.278, Auto is the default permission mode and a classifier answers most permission prompts; start with `claude --permission-mode manual` to answer each one yourself. Answering No ends the turn at once, and a denied compound command reaches the session without saying which part you refused, so name it in your next message. The `mapper` helper runs as a background agent: the turn ends with `Waiting for 1 background agent to finish` and the input looks idle, until the agent finishes on its own (45 seconds on a nine-file repository).

### Session review

A transcript shows where an agent lost time. `session-review` reads one Claude Code transcript or one Codex rollout and proposes changes to the same map file. You start it yourself; no hook starts it and the model cannot start it on its own.

1. A script lists candidates: tool calls that reported an error, output of a command that reads like a read or search, the three largest tool outputs, and navigation candidates (a path that did not exist, a whole file read again, a read the host cut, a host notice in place of a file, a large output), each with a cause it might have. With no argument it finds the session you are in and leaves the audit's own turn out. On Claude Code it also reads the session's subagent transcripts.
2. The skill reads the lines each candidate names, and looks for your corrections, repeated searches and commands tried in several forms.
3. Each finding goes to one place. A project fact goes to the map file. A fact about your machine is reported for your own global instruction file and never written. A mistake a machine could catch is reported as a check to write; when the repository has a `.collet/` directory, that report suggests collet's `check-writer` skill, and without it the report points to the project's own linter or tests. The suggestion never runs anything. A long document goes to `repo-docs`, a structural problem to `repo-layout`, and output a hook or the host added is reported against its source. A bug or a failure that came and went gets no rule, and temporary output, pagination or a search that found nothing gets no change.
4. You see each proposed change with the transcript line behind it and choose which to apply. The skill edits the map file in place, reverts and reports any line no approved entry holds, shows the diff and the line count before and after, and commits nothing.

A transcript carries web pages and tool output, and a rule lifted from it would load into every later session, so the skill treats the transcript as evidence, never as instructions. A findings, report or notes file is written only after you say yes.

**Candidates in detail.** A refused call is a candidate of its own kind on Claude Code: `user-declined`, `permission-refused` or `blocked`, with up to two later calls that reached the same path or program, so you can judge whether one worked around the refusal. After a hook's denial, the same tool with the same input is no retry, because the hook judges it again. A later success never counts a call that ran beside the failure. On Codex, a result with no exit code takes its outcome from what the host wrapped around it; a script that may have dropped a failure stays `unknown`, never a success, and the host's own per-command records settle a result only when they belong to it beyond doubt. A navigation candidate pairs facts from the transcript with a hypothesis about the cause; only a candidate whose scope is a map-file line, documentation, layout or a reporter can lead to a change. A turn that stopped for a word the session did not need, when your next prompt only says to go on (`continue`, `sí, sigue`), is listed as a stall candidate, with a line for your global file unless the ending names a project command.

The script's output is capped (6 candidates by default, 30 at most, with excerpts of at most 480 characters), and run twice on the same transcript it prints identical output.

### Close-out before deleting a session

Deleting a Claude Code session can delete its transcript, and with it any decision or work only the conversation holds. `/anneal:session-review closeout <session id or transcript file>` tells you, before you delete a finished session, whether anything would be lost. It only reports: it never deletes, archives, moves or edits anything and does not offer to save its findings. Run it on a finished session, not the one you are in; it refuses with exit 2 on the current session, and also when it finds no transcript or several for an id.

It lists two kinds of items. A **change** is a file the session wrote with Edit, MultiEdit, NotebookEdit or Write, located now as `tracked`, `ignored`, `untracked`, `outside` the repository, or at risk: `tracked-missing` (gone from disk with uncommitted changes), `missing`, `outside-missing` (such as a helper script in a scratch folder) or `unresolved` (a path it cannot resolve, such as one starting with `~`). A **turn** is the text the assistant wrote after one of your prompts; it counts as held by a file when the turn wrote a file now tracked or ignored, and a `transcript-only` turn is at risk. The verdict is `safe-to-delete` or `would-lose`, and the skill then reads each at-risk item: it drops a throwaway helper or a status-only turn with a reason, keeps a plan, notes or a decision, and counts text as held by a file only when it can cite the file and line. The final line is `Safe to delete.` or `Deleting it would lose:` and the remaining items. A `cleanup` flag also names what the session may have left behind: no `git status --ignored` run after the last change, background commands and preview servers never seen ending, and worktrees and branches it created and never removed.

### The repeated-step search

`/anneal:session-review all [sessions folder or transcript files]` reads many sessions of one repository and lists the steps they repeated the same way, so a plain command or a short script with no model can take their place, plus the navigation candidates several sessions share. It writes nothing.

- The repository must be inside a Git work tree. With no files given it finds the sessions itself: on Claude Code under `<claude home>/projects/<key>/`, including the folders of worktrees Claude Code made and removed; on Codex, each rollout whose first `session_meta` names the repository as its `cwd`. A session's subagent transcripts count toward that session. It skips the running session and lists any transcript it cannot parse as `unreadable`.
- A step matches by text equality after normalization: whitespace collapsed, repository paths, identifiers and temporary paths replaced. A finding is kept when it appears in at least 3 sessions by default (2 to 20), at most 10 per kind (1 to 30). The kinds are commands, sequences of two or three commands, lookups (a read, a Grep or Glob pattern), prompts you typed, and navigation candidates.
- Each finding says whether the map file already names the step and whether a root `package.json` script runs it.

The skill reads only each finding's example lines, states how many sessions it read and over which dates, and routes each finding by the first rule that holds: a step that needed judgement each time gets nothing; a step the map already names gets nothing; a step a project script runs gets a `Commands` line naming it; a step no script runs gets the plain command, or a short script with no network and no model in the project's own scripts folder, plus its `Commands` line; a repeated lookup gets a path hint; a navigation finding goes where the one-session audit sends its scope; a repeated prompt that only runs steps gets the command that runs them; a prompt repeated across repositories, or a step for CI, a hook or a schedule, is reported and never written; a repeated mistake a machine could catch is reported as a check. It shows a prioritized list with each entry's exact text, applies only the entries you approve, then shows `git diff` and the map file's line count before and after. It commits nothing unless asked.

### Documentation

`/anneal:repo-docs` inventories maintained documentation, reviews every in-scope README with its checker, runs the layout audit without entering its migration steps, and checks claims, references, host instructions, development setup and ignore rules against evidence. It proposes routes that take each anticipated task to the one document holding its contract and the check that proves it. Alone or with `audit` it gives findings without edits and saves a report only after you say yes; outside the project it writes only its coverage checklist, in a scratch directory the host names. `fix`, or a cleanup request in your own words, authorizes ordinary documentation fixes. Changes to standing instructions need your authorization, and runtime, hook, permission and publishing changes are proposed separately. The report separates verified claims from unresolved ones, and static host checks from live execution.

**README work.** `/anneal:repo-docs readme`, or a request such as "review and score the README", works on that README alone. Write drafts a new one from facts in the repository; Review scores 14 criteria from 0 to 4 and changes nothing; Improve rewrites after a review; Edit changes only the part you name. Write and Improve pick a minimal, standard or advanced tier. The skill never invents a command, an output, a URL or a license, and lists the facts it could not confirm. The bundled checker, `node scripts/readme-check.js [--tier minimal|standard|advanced] README.md`, prints each finding as `line:rule  message` and exits 1 while findings remain, 0 when there are none, 2 for bad arguments or an unreadable file. Its rules: `fence-unclosed`, `h1-count`, `badge-first`, `fence-lang`, `prompt-in-copy-block`, `no-shown-result`, `placeholder`, `link-text`, `filler`, `long-sentence` (the first sentence over 25 words) and, with `--tier`, `over-budget` (more than 400, 900 or 1200 words of prose). The rules judge no meaning, so the skill's own verification pass still applies.

**Pages for people.** Asked to write, edit or review a help page, guide, how-to, FAQ, troubleshooting page, changelog or contributing guide, the skill works on that page alone. It first settles six facts and labels any it had to assume: the reader, the task, the entry point, the product truth (checked against the code or the running product), the language and locale, and the house style. It keeps tutorials, how-tos, reference pages, explanations and troubleshooting apart, orders a task page as title, outcome, prerequisites, numbered steps, success check and recovery, and ends with a Yes, No or N/A checklist. Its report names the reader and task, every label or limit it could not check, and says the page has not been tested with real readers.

**Adopting the documentation contract.** `/anneal:repo-docs adopt` writes, after you approve each file, the rule `.claude/rules/documentation.md` from a template; one pointer line in each map file present (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`), so Codex and Antigravity, which do not load `.claude/rules/`, still reach the rule; and, for the `solo-public` profile only, ignore rules that hide the private directories, copied whole when the project has no `.gitignore` and otherwise appended where a private directory is not yet ignored. It commits nothing and never untracks a file. The profiles: `solo-public` keeps `docs/tasks/`, `docs/decisions/`, `docs/knowledge/private/`, `docs/apis/private/` and `.private/` ignored and untracked; `private-repo` versions every documentation directory so cloud sessions can read the private records, with `.private/` still ignored (adopt writes no ignore rule for it, so its probe reports a trackable `.private/` for you to fix); `team` is versioned like `private-repo`, puts decisions that bind more than one person in `docs/decisions/` and changes the rule file through ordinary review. It never ignores all of `docs/`, `docs/knowledge/` or `docs/apis/`.

**The documentation check.** `node scripts/docs-check.js --root <project> [--json | --index]` reads every Markdown file under a `docs` directory, ignored files included, and changes nothing. It exits 1 on a high finding, 0 otherwise, 2 for bad arguments or a directory outside Git. The profile comes from the `.gitignore` files; `.git/info/exclude` and `core.excludesFile` do not count, since a clone does not carry them.

| Severity | Finding | When |
| --- | --- | --- |
| high | `private-visible` | `.private/` is not ignored, or some private documentation directories are ignored and others are not |
| high | `public-ignored` | `docs/README.md`, `docs/knowledge/current-contract.md` or `docs/apis/current-api.md` would be ignored |
| high | `tracked-private` | A tracked file sits in a private directory at any depth |
| high | `public-links-private` | A tracked public Markdown file links a private path |
| medium | `task-note-large` | A task note over 20,000 characters |
| medium | `history-doc-large` | A private knowledge or API document, or a file named for history, over 50,000 characters |
| medium | `task-note-completed` | A task note with `status: completed`, to fold into its topic and delete |
| low | `frontmatter-missing`, `frontmatter-field-missing`, `frontmatter-type-unknown` | No frontmatter, no `type`, `summary` or `related_files`, a task note without a valid `status`, or a type outside `task_summary`, `adr`, `api_spec` and `knowledge` |
| low | `type-folder-mismatch` | A type that does not match its `docs/` folder |
| low | `related-file-missing` | A `related_files` entry that exists neither from the repository root nor from the directory holding the file's `docs/` |
| low | `filename` | Not kebab-case, a bare id such as `240.md`, or a date; `<id>-<slug>` is allowed |

A `README.md`, `AGENTS.md`, `CLAUDE.md` or `SKILL.md` needs no frontmatter, `related_files` entries with glob characters are not checked, and the frontmatter reader handles top-level keys and the `related_files` list, not full YAML.

**The record index.** `--index` prints Markdown for `docs/index.md`, one line per maintained record with its path and `summary`, grouped by `type` (`adr`, `api_spec`, `knowledge`, `task_summary`, then `other`), so an agent finds a record instead of guessing a path. It lists only files Git does not ignore, and leaves out private records when private documentation is ignored. It exits 0 whatever the check would find, and writes nothing: save the output as `docs/index.md` yourself. `adopt` offers to write it and point the map file's `Start here` at it, and `maintain` regenerates it and proposes the difference.

**Maintenance proposals.** `/anneal:repo-docs maintain` runs `node scripts/docs-maintenance.js --root <project> [--store <file>]... [--transcripts <directory>]... [--memory <directory>]... [--json]`, which changes nothing, and shows the proposals grouped by kind; nothing changes in a group until you approve it. Deleting, merging and condensing records are never ordinary fixes.

| Proposal | When |
| --- | --- |
| `drift` | A related file, or a file below a related directory, changed after the doc |
| `drift-private` | The same, for a private knowledge or API document |
| `fold-completed` | A task note with `status: completed` untouched for more than three days; with transcripts, only when no other session read it in the three days after its last write |
| `condense` | A `task-note-large` or `history-doc-large` finding |
| `merge-per-entry` | Three or more docs in one folder that share a name prefix, each with a summary naming a roadmap entry |
| `fold-store` | A record of a JSONL store passed with `--store` that has a `paths` list, with the doc whose `related_files` covers one of those paths most specifically |

A tracked file's date is its last commit, or its file time when it has uncommitted changes; an untracked or ignored doc has only its file time, and a copy resets that, which can hide a proposal and never invents one. Task notes and decision records describe the past, so later code changes do not make them drift. Without `--transcripts` the script reads the project's Claude Code transcripts and those of its `.claude/worktrees/` sessions; Codex and Antigravity transcripts are not read.

**Native memory.** With `--memory <directory>` (or, by default, the project's Claude Code memory folder), the script also checks one Markdown file per memory plus a `MEMORY.md` index. It never writes to the folder, and refuses a folder without `MEMORY.md` with exit 2.

| Proposal | When |
| --- | --- |
| `memory-index-orphan` | A `MEMORY.md` link finds no file |
| `memory-unindexed` | A memory file that no `MEMORY.md` link reaches, so no session loads it |
| `memory-missing-path` | A memory's backticked text names a relative path absent from the project, an `npm run` script missing from the root `package.json`, a `--flag` that no project file outside the memory folder contains, or a `[[name]]` link with no `name.md` |
| `memory-duplicate` | Two memories share at least 40% of their distinct words of four letters or more |
| `memory-stale-state` | A memory last modified more than 14 days ago has a sentence with a word that states a current condition, such as `still`, `now`, `currently`, `pending` or `no longer` |

A path counts only when its first folder exists in the project, so Git refs such as `origin/main` are left alone. After a `cd` in the same command, an `npm run` script or a flag is not checked, since it belongs to that directory. Flags are checked only in `node`, `bash`, `sh`, `py`, `python` or `pwsh` script commands and in `npm run <script> -- --flag`. A memory's date is its `modified` frontmatter field, or its file time.

### The hooks

anneal installs three hooks. None uses a model, and the suite runs each as a separate process with every host's payload.

**Safety hook.** While a branch named `anneal/<YYYY-MM-DD>`, or one of its set-aside branches, is checked out, it refuses the git commands that would throw away the migration's commits or the working tree they were checked against: `reset --hard`, `clean -f`, `checkout --force`, `switch --discard-changes` or `--force`, `push --force` or a `+` refspec, `branch -D` or a forced delete, forced `checkout -B`, `switch -C` and `branch -f` or `-M` onto the checked-out branch, `update-ref` setting or deleting it, and `push .` with a refspec whose destination is that branch. It also refuses commands that rewrite those commits (`commit --amend`, `rebase` other than `--abort` and `--quit`, `update-ref -d`, `reflog expire` or `delete`), and a commit or merge that skips the Git hooks (`--no-verify`, `-n`, or `git -c core.hooksPath=<dir> commit`), so each step has to pass its checks. A commit message that holds a word such as `-n` or `--no-verify` is refused as well; reword it. `push --force-with-lease` is allowed. Undo a step with `git revert`, or leave the branch to abandon the migration.

On every other branch the hook asks before one kind of command: one that deletes, overwrites or moves a migration branch that holds commits the checked-out branch lacks, since those commits may belong to another run. The same command on a migration branch the checked-out branch already contains runs without a question. Claude Code shows the question as a permission prompt, and Antigravity's documentation, read on 2026-11-14, lists it as a decision that prompts you. Codex's documentation, read the same day, says Codex parses the question but does not support it yet and would run the command, so on Codex the hook refuses the command instead; to delete or move such a branch there, run the command yourself outside the session. Neither host's answer was observed in a live session. The hook matches command text, so it cannot see every rewrite, such as git run through a variable.

**Instruction guard.** It refuses a file-tool write that puts invisible characters into a file agents load as instructions, in every session, migration or not. It checks the same files and characters as the audit's hidden-character finding, with the same exceptions, on `Write`, `Edit`, `MultiEdit` and `apply_patch` in Claude Code and Codex and on `write_to_file`, `replace_file_content` and `multi_replace_file_content` in Antigravity. The refusal names the file and each code point, and counts Unicode tags without listing them. To write about such a character in an instruction file, write its code point as text. It does not see a write through a shell command, such as `Set-Content` or a here-document; the audit still reports what lands. A byte order mark in an `Edit`, `MultiEdit` or patch text is refused even at the start of the file. On Antigravity the guard reads every text argument, so an edit is refused when the text it replaces already holds such characters; remove them another way. Which Antigravity arguments hold the new text has not been checked. A live refusal is unverified on every host.

**Session-start line.** On Claude Code and Codex, a hook adds one line to what the agent reads first, for example: `anneal: 2 completed task notes are still on disk: docs/tasks/12-login.md, docs/tasks/15-export.md. Fold each one's findings into its topic documents, then ask the owner before deleting it. Record index: docs/index.md; search it before guessing a docs path.` It holds two facts: the notes with `status: completed` still on disk (their count and up to ten paths), and where the record index is, or that there is none. It only reads, and deleting a note stays your decision. It counts a finished note from the moment it is marked, without the three-day wait of the maintenance proposals. It stays silent when the project has no Markdown file under a `docs/` folder, when the hook fails, or when `ANNEAL_SESSION_REPORT` is `off`, `0` or `false`. Antigravity has no such hook. Whether a host passes the line to the agent is unverified.

## What you can do

Examples use Claude Code syntax. On Codex use `$<skill-name>`; on Antigravity use `/<skill-name>`.

| Task | Claude Code | Codex | Antigravity |
| --- | --- | --- | --- |
| See what anneal finds and which skill to run next | `/anneal:overview` | `$overview` | `/overview` |
| Audit without edits | `/anneal:repo-layout audit` | `$repo-layout audit` | `/repo-layout audit` |
| Plan a migration and approve each step | `/anneal:repo-layout` | `$repo-layout` | `/repo-layout` |
| Propose instruction changes from one session | `/anneal:session-review [transcript file]` | `$session-review [transcript file]` | `/session-review [transcript file]` |
| Check whether deleting a finished session would lose work | `/anneal:session-review closeout <session id or transcript file>` | `$session-review closeout <rollout>` (reads Claude Code transcripts only) | `/session-review closeout <transcript file>` |
| Find what many sessions repeat | `/anneal:session-review all [sessions folder or transcript files]` | `$session-review all` | `/session-review all <transcript files>` |
| Report where documentation disagrees with current behavior | `/anneal:repo-docs` | `$repo-docs` | `/repo-docs` |
| Apply fixes, trim, adopt a policy, or work on one README | `/anneal:repo-docs [fix\|maintain\|adopt\|readme] [path or concern]` | `$repo-docs [fix\|maintain\|adopt\|readme]` | `/repo-docs [fix\|maintain\|adopt\|readme]` |

No command edits your project on its own word. Each one reports, or proposes and waits for your approval, unless you type the word that applies: `fix` for documentation. `session-review` is user-invoked only.

### Audit the layout

Ask for an audit, such as `/anneal:repo-layout audit`. The skill runs the scan and reports findings by severity, with counts and example paths, followed by observations. Audit mode changes nothing on its own; it saves its findings only after you say yes.

You can also run the scan directly from the installed plugin folder or a clone of this repository. Replace `<your-repository>` with the directory to inspect:

```shell
node scripts/audit.js --root "<your-repository>"
```

It prints the findings, discovered map files, available checks, and the characters each session loads before its first prompt. Add `--json` for the evidence behind each count.

### Migrate, review sessions, reconcile documentation

A migration runs baseline checks, proposes changes and creates an `anneal/<YYYY-MM-DD>` branch for approved steps; each successful step is checked and committed. Session review proposes edits and waits for approval; it commits nothing. `/anneal:repo-docs` alone, or with `audit`, reports findings; with `fix`, or when you ask for a cleanup in your own words, it applies the ordinary corrections. Its `adopt` mode writes the project-local documentation rule and a map pointer, each after you approve it. Its `maintain` mode proposes trims. Its `readme` mode writes, reviews or repairs one README and runs a bundled checker on it.

### Settings

anneal has no settings file and no settings panel: you choose a skill and its mode. One environment variable changes a hook, and the script options below change a script run by hand or by a skill.

| Setting | Values | Effect |
| --- | --- | --- |
| `ANNEAL_SESSION_REPORT` | `off`, `0` or `false` | Turns off the session-start line. Set it in the `env` block of Claude Code's `settings.json`, or in the shell that starts the host (Codex, Claude Code or Antigravity); a host that is already running does not pick up a change made in a new shell. Any other value leaves the line on |
| `CLAUDE_CONFIG_DIR` | a folder | Your Claude Code home; the default is `~/.claude`. The audit, the session scripts and the maintenance proposals read global files, memory and transcripts from it |
| `CODEX_HOME` | a folder | Your Codex home; the default is `~/.codex` |
| `CLAUDE_PROJECT_DIR` | a folder | The project the session-start line reads; the default is the session's working folder, or the top of its Git working tree |

Neither `CLAUDE_PROJECT_DIR` nor the two homes is an anneal setting; anneal reads them as the host sets them. The hooks also read an `ANNEAL_HOST` variable, but only as a fallback when the hook command carries no host name, which the shipped hook files always do, so there is nothing to set.

| Script | Options |
| --- | --- |
| `scripts/overview.js` | `--root <repository>`, `--json`, `--no-sessions` (the skill's `no-sessions` argument) to read no past session |
| `scripts/audit.js` | `--root <repository>`, `--json`, `--global <file>` (once per file; replaces your global file, and your Codex file too), `--memory <file>` (replaces the memory index) |
| `scripts/session-evidence.js` | `--before-line <line>` or `--before <time>` to cut the interval, `--limit <n>` (6 by default, 30 at most) |
| `scripts/session-closeout.js` | `--session-id <id>` or `--session-file <file>`, `--root <repository>` |
| `scripts/session-repeats.js` | `--root <repository>`, `--sessions-dir <dir>`, `--session-file <file>` (each repeatable), `--also-root <repository>` (counts toward prompts only), `--min-sessions <2-20>` (3), `--limit <1-30>` (10) |
| `scripts/docs-check.js` | `--root <project>`, `--json`, `--index` |
| `scripts/docs-maintenance.js` | `--root <project>`, `--store <file>`, `--transcripts <directory>`, `--memory <directory>` (each repeatable), `--json` |
| `scripts/readme-check.js` | `--tier minimal\|standard\|advanced`, then the README |

## Install

anneal is one package for Claude Code, Codex and Antigravity. Install it in the one you use. Every host needs Node.js 22 or later, because the scan runs on it; confirm `node --version` reports 22 or later. A migration also needs a Git repository with a commit, a clean working tree, and `git config user.email` set. Audit mode does not require these.

### Claude Code

Requirements: Node.js 22 or later, Git and Claude Code 2.1.323 or later.

Inside Claude Code:

```text
/plugin marketplace add V-Songbird/foundry
/plugin install anneal@foundry
```

Start a new session to load it. In a terminal, `claude plugin list` names `anneal` once installed.

### Codex

Requirements: Node.js 22 or later, Git and a Codex host with plugin support.

```text
codex plugin marketplace add V-Songbird/foundry
codex plugin add anneal@foundry
```

Before guarded work, open `/hooks` in Codex CLI and review and trust the plugin's `SessionStart` hook and its two `PreToolUse` hooks. A changed hook definition or hook script needs another review; see [Codex hook trust](https://learn.chatgpt.com/docs/hooks#review-and-trust-hooks). Then start a new Codex session. Installing the plugin alone does not mean its hooks run.

### Antigravity

Requirements: Node.js 22 or later, Git and the Antigravity CLI. Antigravity has no marketplace for third-party plugins, so install anneal from a clone of Foundry, which checks anneal out at the commit the Claude Code and Codex catalogs pin. Replace `<path-to-clone>` with the directory to clone into:

```shell
git clone --recurse-submodules https://github.com/V-Songbird/foundry.git <path-to-clone>
agy plugin install <path-to-clone>/anneal
agy plugin list
```

The list names `anneal`. If it does not, the install did not register: run the install command again with the clone path. Start a new conversation to load it. With `--sandbox`, headless `agy` runs no shell command.

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

An Antigravity install is a copy, so it stays at the commit it was installed from. Update the clone, install again and start a new conversation:

```shell
git -C <path-to-clone> pull
git -C <path-to-clone> submodule update --init
agy plugin install <path-to-clone>/anneal
```

## Good to know

> **Experimental.** No support or stability promise. It can change or disappear without a migration path.

- Findings are heuristics; framework conventions and project instructions take precedence. A flagged `index` file may be exactly what your framework expects, which is why nothing moves without your approval.
- When Git cannot read an ignore file, such as a global excludes file a sandbox denies, the audit lists untracked files without that file's rules and names it in a `limitation:` line. A folder only that file ignores then shows up in `build-output-not-ignored`; a clone never carries the global file, so the finding still holds for the repository.
- Observations match the paths a map names, not what its sentences mean: a package mentioned without its path, as in "the pricing package", counts as not named. Headings are read in Markdown only.
- Import rewriting covers relative `import`, `export … from`, `import()` and `require()` in JavaScript and TypeScript family files (`.js`, `.ts`, `.vue`, `.svelte` and their variants). Path aliases, other languages, config files and documents are found by searching and shown inside the step, and they need review. anneal reports code that builds names at runtime and never rewrites it.
- Moving files collides with branches other people have open. Migrate when few are.
- A session audit reads one session. It cannot tell a pattern from an accident, so "repeated" means repeated inside that session. A candidate's cause rests on names, paths and order alone; a later file with the same name can be another file.
- The many-sessions pass matches steps as text after normalization, so two commands that do one job in different words are two steps, and it lists them without judging them; most repeated reads are ordinary work. A command is copied at most 480 characters long, a prompt key at 120. It finds Claude Code and Codex sessions on its own; on Antigravity, which has no known transcript location, it reads only the files you hand it. Its Codex discovery is held by test fixtures only and has not been checked on a real Codex home. It has run only in eval cases through the Agent SDK, not in an interactive session.
- Transcript parsing depends on the formats covered by tests; a host that changes its format can break a parser. Antigravity requires an explicit transcript file. The close-out check reads Claude Code transcripts only, and it counts but does not read subagent records and saved tool outputs. A turn that wrote any file now tracked or ignored counts as held by a file even when that file is unrelated to the turn's decision. A shell command that changed files is not listed. Its cleanup flag misses a process started another way, such as with `&`, and git commands inside a here-document.
- On Codex, the outcome of a result with no exit code rests on the wrappers and records current rollouts show; a script is read by pattern, not parsed, so a call it builds at run time reads as `unknown` and a failure dropped in an unusual way can still read as `ok`. A plugin or hook that rewrites a tool's output leaves a marker the evidence cannot tell from the tool's own output.
- Redaction of credentials, your home directory and your account name in the evidence is best effort. The session file path is copied unredacted and can show your home directory and account name. Read an excerpt before you share it.
- The shell recognition in the evidence is small: a pipeline through an unknown program, command substitution or a redirect into a file counts as a mixed command.
- Documentation checks cover the stated evidence, do not prove every claim, host or distribution safe, and do not scan Git history by default. Maintenance dates rest on commits or file times.
- The safety hook and the instruction guard match command or file-tool text, so they cannot see every rewrite or write. A live refusal is unverified on every host.
- The `claude plugin eval` harness needs a sandbox, so its live cases do not run on native Windows.
- A complete migration, with the Git guard's refusal on its branch, has been observed in interactive sessions on Claude Code 2.1.278, with a script rather than a person answering the prompts, and in the Antigravity IDE 2.17.0, with a person answering. On Codex CLI 0.155.1 it has been observed with a script answering and the project's `.git` added as a writable root (`codex exec --add-dir <project>/.git`, because the `workspace-write` sandbox keeps `.git` read-only); that plan only changed the map file, so a migration that moves files is unverified on Codex.
- The audits and session review have run in Claude Code, in headless Codex CLI 0.155.1 and headless Antigravity CLI 1.2.8 and 1.2.9 without `--sandbox`, and a repo-layout audit has run in the Antigravity IDE and the Codex desktop app 26.917. In the Antigravity IDE, the other flows are unverified. On Antigravity CLI 1.2.7, `agy plugin list` names `anneal` after installation.
- These results come from runs on specific host versions, some with a script rather than a person answering the prompts.
- Installing from the Foundry marketplace has not been observed on any host.

## The numbers

Each result belongs to the named model and recorded run. Missing measurements remain marked as unmeasured. The harness and raw records behind these figures are kept outside this repository. Results can vary between runs.

### Claude Code results

The first two tables compare two map files, not sessions with and without anneal: no session in them loaded the plugin. They test the kind of `Start here` line that points an agent at the right package or contract section.

<!-- foundry:evidence {"platform":"Claude","status":"measured","models":["Claude Opus 5"],"date":"unknown","dateReason":"The run date is not recorded.","revision":"not recorded","revisionReason":"The commit the run used is not recorded.","reviewedAt":"2026-11-16"} -->
| Model | Map file | Correct runs | Contract characters read | Contract task cost |
| --- | --- | --- | --- | --- |
| Claude Opus 5 | Original | 6/6 | About 123,000 | $1.10 |
| Claude Opus 5 | With two `Start here` lines | 6/6 | About 31,000 | $0.68 |

Paired navigation runs: Claude Code 2.1.278 under WSL2 with `claude-opus-5[1m]`, twelve runs, three tasks by two map files by two fresh sessions. The arms did not differ in correctness. All twelve sessions read the map first, and all six with the lines received them. The characters and the list-price cost estimate cover the two runs of the contract task in each arm; the runs with the extra lines took 58 seconds against 45. In the package lookup, the original runs opened three decoy files and the runs with the lines opened one. In the control task, which needs no orientation, the extra lines cost 244 characters, and the oriented runs used 8 tool calls against 11. Two runs per arm cannot tell a small effect from noise.

<!-- foundry:evidence {"platform":"Claude","status":"measured","models":["Claude Opus 5"],"date":"unknown","dateReason":"The run date is not recorded.","revision":"not recorded","revisionReason":"The commit the run used is not recorded.","reviewedAt":"2026-11-16"} -->
| Model | Map file | Correct runs | Contract characters read | Contract task cost |
| --- | --- | --- | --- | --- |
| Claude Opus 5 | Original | 6/6 | About 123,000 | $1.18 |
| Claude Opus 5 | With two `Start here` lines | 6/6 | About 17,000 | $0.57 |

Held-out checks: the same protocol, host and model on a second repository with another layout and contract, twelve runs. The contract task took about 45 seconds in each arm. In the package lookup, one original run opened two decoy files; the runs with the lines opened none. The extra lines cost 238 characters, and the oriented control runs used 8 tool calls against 10.

<!-- foundry:evidence {"platform":"Claude","status":"measured","models":["Claude Opus 5"],"date":"unknown","dateReason":"The run date is not recorded.","revision":"not recorded","revisionReason":"The commit the run used is not recorded.","reviewedAt":"2026-11-16"} -->
| Model | Case | Score with anneal | Score without |
| --- | --- | --- | --- |
| Claude Opus 5 | `audit-reports-without-changes` | 1.00 | 0.93 |
| Claude Opus 5 | `migration-stops-on-uncommitted-work` | 1.00 | 0.83 |
| Claude Opus 5 | `session-audit-proposes-without-writing` | 1.00 | 0.75 |

Three cases, three runs per arm, 18 sessions, on Claude Code 2.1.278 with its default model `claude-opus-5`, taking about 13 minutes at a list-price estimate near $5. Graders that depend on the plugin are indicators and are left out of the score. The graders on the final reply passed 17 of 18 times without the plugin: one run without it renamed two files before it stopped, and two other graders caught the renames. The session case's difference comes from a grader that passed in all three runs with the plugin and none without. Three runs per arm is a small sample.

Smaller recorded runs, all on Claude Code 2.1.278 under WSL2 with three runs per arm unless noted:

- An unreadable transcript (2026-09-23, model not recorded): a transcript with one record cut. Every run named the refusal. With anneal each run stopped after the script's message and the case scored 1.00, at a list-price estimate of $1.53 for the case; without it each run read the file itself and still proposed a command from the refused part, and the case scored 0.75.
- A map read without any code session (2026-09-23, model not recorded, no baseline arm): the map with `Start here` lines answered all four questions, quoting the two lines in every run (list-price estimate $1.16); the original map made every reader answer `not in the notes` for the package and the section (estimate $0.38). Both scored 1.00.
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

The first SDK baseline, on 2026-11-09: 15 cases, three runs with anneal and three without, on `claude-opus-5-5` through the Claude Agent SDK 0.3.299 rather than a Claude Code session, with the judged graders on `claude-sonnet-5-5`. The table lists every outcome grader where the two arms differed, in six cases. With anneal, 13 of the 15 cases passed every grader in all three runs. Four cases passed their outcome graders in every run of both arms, so they show nothing for the plugin until they are hardened. Graders that read anneal's own evidence output fail without the plugin by construction and are left out. Three runs per arm are exploratory, not a stable estimate.

Two cases did not pass every grader with the plugin. A review of a help page scored one of its two reply graders 1 of 3 with the plugin and 3 of 3 without; the replies named the planted defect in wording the pattern missed, and read as a reviewer would, every run in both arms named both planted defects. A migration into a new directory stopped in every run with the plugin because the session had no Git identity, which the runner now supplies. A rerun of both migration cases on 2026-11-09, same runner and model, three runs per arm, cost an estimated $1.32: with the plugin every run created the branch, moved the file, rewrote both imports and committed the step, and without it no run created the migration branch or made an `anneal:` commit. Three graders failed runs that did the step, for reasons in how the run was checked rather than in what it did, so those graders and the skill's wording were corrected afterwards, and the recorded runs were regraded without running again.

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

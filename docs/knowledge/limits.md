---
type: knowledge
summary: "Every current limit of Anneal in full: what its findings, import rewriting, session reviews, redaction and documentation checks do not cover, and which behavior is observed, tested or unverified on each host; read before relying on an Anneal finding, and before changing a script."
related_files:
  - README.md
  - docs/knowledge/how-it-works.md
---

# Anneal limits

This page states each limit of Anneal in full. The README names each one in a line, under [Good to know](../../README.md#good-to-know).

Anneal is experimental. It has no support or stability promise, and it can change or disappear without a migration path.

- Findings are heuristics. Framework conventions and project instructions take precedence. A flagged `index` file may be what your framework expects.
- When Git cannot read an ignore file, such as a global excludes file a sandbox denies, the audit names it in a `limitation:` line. A folder only that file ignores shows in `build-output-not-ignored`, which still holds for a clone.
- Observations match the paths a map names, not what its sentences mean. "The pricing package" without a path counts as not named. Headings are read in Markdown only.
- Import rewriting covers relative imports and `require()` in JavaScript and TypeScript family files (`.js`, `.ts`, `.vue`, `.svelte` and variants). Aliases, other languages, config files and documents are found by searching and need review. Code that builds names at runtime is reported, never rewritten. Moving files collides with branches others have open; migrate when few are.
- A session audit reads one session, so "repeated" means repeated inside it. A cause rests on names, paths and order alone: a later file with the same name can be another file.
- The many-sessions pass matches text, so two commands doing one job in different words are two steps. It lists without judging, and most repeated reads are ordinary work. A command is cut at 480 characters, a prompt key at 120.
- It finds Claude Code and Codex sessions on its own. On Antigravity, which has no known transcript location, it reads only files you hand it. Codex discovery is held by fixtures only. The pass has run only in eval cases through the Agent SDK, not interactively. The overview has not run live on any host.
- Transcript parsing depends on formats covered by tests, so a host format change can break it. On Codex, a result with no exit code takes its outcome from wrappers and records current rollouts show. Scripts are read by pattern, so a call built at run time reads `unknown` and a failure dropped in an unusual way can read `ok`. Shell recognition is small: an unknown pipeline, substitution or redirect counts as mixed. Output rewritten by a plugin or hook leaves a marker the evidence cannot tell from the tool's own output.
- Close-out reads Claude Code transcripts only and does not read subagent records and saved outputs. It counts a turn as held when it wrote any tracked or ignored file, even if unrelated, and lists no file a shell command changed. Its cleanup flag misses a process started with `&` and git commands inside a here-document.
- Redaction of credentials, your home directory and your account name is best effort, and the session file path is copied unredacted. Read an excerpt before you share it.
- Documentation checks cover the stated evidence, do not prove every claim, host or distribution safe, and do not scan Git history.
- A complete migration, with the Git guard's refusal on its branch, has been observed in interactive sessions on Claude Code (a script answering the prompts) and the Antigravity IDE (a person answering). On Codex CLI it was observed with a script answering and the project's `.git` added as a writable root (`codex exec --add-dir <project>/.git`, since `workspace-write` keeps `.git` read-only). That plan only changed the map file, so a migration that moves files is unverified on Codex.
- The audits and session review have run in Claude Code, headless Codex CLI and headless Antigravity CLI without `--sandbox`. A repo-layout audit has run in the Antigravity IDE and the Codex desktop app, and its other flows are unverified. On Antigravity CLI, `agy plugin list` names `anneal` after installation.

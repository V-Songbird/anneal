---
type: knowledge
summary: "The one Anneal environment switch, ANNEAL_SESSION_REPORT, where to set it, and the host variables Anneal reads but does not own."
related_files:
  - README.md
  - hooks/hooks.json
---

# Anneal settings

This page lists every setting a user can set for Anneal, its values and its effect. The short form is in the README, under [How to use it](../../README.md#how-to-use-it).

Anneal has no settings file or panel: you choose a skill and its mode. [Script options](how-it-works.md#script-options) lists each script's flags.

| Setting | Values | What it does |
| --- | --- | --- |
| `ANNEAL_SESSION_REPORT` | `off`, `0` or `false` | Turns off the line Anneal prints when a session starts. Any other value leaves it on. |
| Where to set it | The `env` block of Claude Code's `settings.json`, or the shell that starts the host | A running host does not pick up a new shell. |
| `CLAUDE_CONFIG_DIR`, `CODEX_HOME` | A folder; defaults `~/.claude` and `~/.codex` | Not Anneal settings. Anneal reads them as the host sets them, to find global files, memory and saved sessions. |
| `CLAUDE_PROJECT_DIR` | A folder; default the working folder, or the top of its Git tree | Not an Anneal setting. It is the project the session-start line reads. |

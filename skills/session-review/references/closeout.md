# Close-out

Report whether deleting one finished Claude Code session would lose anything. This mode only reports: never delete, archive, move or edit a session, a transcript or a file, and never offer to save the findings unless asked.

```
node "<plugin root>/scripts/session-closeout.js" --session-id "<id>" --root "<git rev-parse --show-toplevel>"
```

With a transcript path, pass `--session-file "<path>"` instead of `--session-id`. Never run it on this session: a live session is not finished.

- When the script exits 2 and says it is the session running this command, stop: report that this session cannot be closed out until it has ended, and run nothing else.
- When it exits 2 otherwise, it found no single transcript. Ask the owner for the file. Never pick the most recent session as a guess.
- When it exits 1, the transcript is not a readable Claude Code transcript or the root is not a Git work tree. Report its message and stop.

Compare `context.cwd` with the root as [step 1 of the skill](../SKILL.md#1-collect-the-evidence) does: expand a leading `~` to the home directory, and compare with slashes. When the session ran in another checkout, run the script again with that checkout as `--root`; when it ran in another project, say so and stop.

The script prints `items` and a `verdict`. A `change` item is a file the session wrote, with its `location`: `tracked`, `tracked-missing`, tracked but gone from disk with uncommitted changes, `ignored`, `untracked`, `outside` the repository, `missing`, gone and no longer tracked, whether Git never held it or a commit removed it (history may hold an earlier version, not an uncommitted edit), `outside-missing`, written outside the repository and since removed, or `unresolved`, a path the script could not resolve. For an `unresolved` change, check by hand whether that file still exists and is tracked or ignored. A `turn` item is one turn's text, from one typed or queued prompt to the next: `ending` copies its last text, and `textLines` names every line where it wrote text. It is `file` when that turn wrote a file now `tracked` or `ignored`, `transcript-only` otherwise. `atRisk` marks what only the transcript holds.

For each `change` item at risk, read its `callLines` in `sessionFile`. Drop it, with a one-line reason, only when its content is a throwaway helper, such as a probe script, an arguments file or a generated fixture; several helpers in one folder can share one reason. Keep a plan, notes or a decision unless you can cite another file and line that holds it.

For each `turn` item at risk, read every line in its `textLines` in `sessionFile`, since a decision can come before the turn's last text. Drop the turn, with a one-line reason, only when none of those lines holds more than status, such as "Done." or a test count. For a decision, a finding or a plan, search the repository and its ignored records, such as `docs/tasks/`, `docs/decisions/`, `docs/knowledge/private/` and `.private/`, for its key terms. Count it as held by a file only when you can cite the file and line.

Then give one verdict line: `Safe to delete.`, or `Deleting it would lose:` followed by each remaining item with its transcript line or path. Name `alsoDeleted` as material that goes with the session and was not read, and state the script's `limits`.

Then report `cleanup` on its own line, apart from the verdict: `Closed clean.` when its `flag` is `clean`; otherwise `Cleanup not shown:` followed by each `leftovers` item with its `kind`, `id` and `callLine`, and, when `ignoredStatusLine` is null, that no `git status --short --ignored` ran after the last change at line `lastChangeLine`, or, when `lastChangeLine` is null, that none ran in the session. State `cleanup.limits`. Never stop a process, remove a worktree or branch, or delete a file for it.

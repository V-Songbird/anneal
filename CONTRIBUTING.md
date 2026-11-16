# Contributing

This plugin is part of the [Foundry Collection](https://github.com/V-Songbird/foundry) and is maintained by a single author. Contributions are welcome in the form of bug reports, suggestions, and pull requests.

## Before opening a PR

- Check existing issues first — the problem may already be tracked or intentionally deferred.
- For substantial changes (new skills, significant refactors), open an issue first to align on direction before writing code.

## Structure

One package serves Claude Code, Codex and Antigravity.

```
.claude-plugin/
└── plugin.json        # Claude Code metadata and version
.codex-plugin/
└── plugin.json        # Codex metadata and version; points Codex at its hook file
plugin.json             # Antigravity metadata and the same version
hooks.json              # Antigravity event wiring, keyed by the plugin name
LICENSE                 # MIT
README.md               # the front page: what it is, install, settings, results
assets/                 # the icons the manifests name, the banners, host cards, Ember scene and evidence graphics the README shows
docs/knowledge/         # how-it-works.md and benchmarks.md, the detail the README links
skills/                 # overview, repo-layout, repo-docs and session-review, read by every host
├── skill-name/
│   ├── SKILL.md        # skill definition
│   ├── agents/         # Codex display name and default prompt
│   ├── assets/         # the skill's icon
│   └── references/     # reference files loaded by the skill
agents/mapper.md        # the read-only layout surveyor the repo-layout skill starts
hooks/                  # hooks.json (Claude Code), codex-hooks.json, safety-guard.js,
                        # instruction-guard.js and session-start-records.js
scripts/                # the audit, documentation, README and session-evidence scripts
├── git-hooks/          # the commit gates, shared with the other Foundry plugins
templates/              # the documentation rule and ignore rules `repo-docs adopt` writes
evals/                  # eval cases for `claude plugin eval`, with their fixtures and graders
tests/                  # Node tests
```

Root JavaScript is CommonJS. The README shows the art in `assets/`, keeps its detail on the pages in `docs/knowledge/`, and names the host beside every host-specific instruction and result. Each result identifies its host, model, date and sample size; keep losses and limits, show `Not measured` where evidence is absent, and never present a Claude Code result as a Codex result.

**No anneal command edits a project on its bare name.** Audits report, and every change waits for the owner's approval of that step. A public file never names another project except where it was measured, and states only numbers that were measured.

**Skills are instruction files read by every host.** A change to a `SKILL.md` changes how Claude Code, Codex and Antigravity read the skill. Be precise, and try the affected skill in a real session of each host before a release. A plugin skill carries no `license` and no `metadata.version`; the manifests hold them.

**Hooks run on matching tool calls and session events.** Keep them fast, keep network calls out, and test on Windows, Linux and macOS. A new hook event needs an entry in `hooks/hooks.json`, `hooks/codex-hooks.json` and, when Antigravity has the event, the root `hooks.json`. Codex users must review and trust a new or changed hook in `/hooks`; say so in the release notes.

**The root `plugin.json` is Antigravity's manifest.** It carries no `$schema` and no `com.openai` extension, so Codex keeps reading `.codex-plugin/plugin.json` and finds its hooks.

## Tests

Run the suite before submitting:

```
node --test
```

It needs Node.js 22 or later, Git and no dependency installation. CI runs it on Windows, Linux and macOS with Node.js 22. Include regression coverage for changed script or hook behavior.

The suite feeds each hook the events a host sends and grades the eval cases without a model. It does not establish that a Claude Code, Codex or Antigravity installation has enabled or trusted the hooks; only a session on that host shows that. `node scripts/audit.js --root .` runs anneal's own navigation audit on this repository, and `node scripts/git-hooks/check-readme-nav.js` checks the README's navigation line and every heading anchor linked from a tracked Markdown file. `claude plugin validate .` checks Claude Code's package shape, and `agy plugin validate .` Antigravity's; it warns that `hooks/hooks.json`, Claude Code's file, is never loaded.

The eval cases under `evals/` start paid model sessions through `claude plugin eval`, which needs a sandbox that native Windows lacks: run it under WSL2 or Linux with `bubblewrap` and `socat`. Run them from the repository root, with the results outside it:

```
claude plugin eval . --tag smoke --tag safety --scaffold --no-publish --allow-tools Bash Edit Write --output-dir <results>
```

Each case folder holds its prompt, fixture script and graders, and `tests/eval-graders.test.js` checks the graders offline against replayed fixtures.

Pitfalls:

- Navigation findings are heuristic. The runtime-name examples in `tests/audit.test.js` exercise the detector on purpose, and the audit also reports two matches in `scripts/session-evidence-navigation.js`.
- `tests/eval-harness.js` has a twin: collet keeps the same file as `tests/eval-harness.cjs`. Change both together, since no test compares the two repositories.
- Three eval graders hold regex text in their frontmatter that a Markdown link checker takes for seven links. Tests pin the patterns, so exclude `graders/` from such a check instead of changing them.
- On Node.js 22 a suite that fails outside its tests, in a `describe` callback or an `after` hook that throws, can still exit 0.
- Some write tools turn a `\u` escape back into the raw character. After writing an invisible-character escape, check that the file still holds the escape.

## Git hooks

Run this once after cloning:

```
git config core.hooksPath scripts/git-hooks
```

- `pre-commit` runs `node --test tests/*.test.js` and blocks the commit on failure. It also blocks a commit that stages a Markdown file while the root `README.md` lacks its navigation line, or while a link to a heading anchor in any tracked Markdown file no longer resolves.
- The Foundry plugins keep byte-identical copies of the files under `scripts/git-hooks/`, `tests/readme_nav.test.js`, `tests/pre_commit.test.js` and `tests/fixtures/github-slugger-fixtures.json`; change them together.
- Keep credentials and personal session data out of commits.

## Release notes

Release notes live on the [releases page](https://github.com/V-Songbird/anneal/releases). Describe every user-visible change in your pull request so it can go into the next release's notes. The version lives in `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` and `plugin.json`. Change them together; the suite fails when they differ.

Installation, marketplace changes and migration are separate from source changes. A pull request must not update a contributor's installed plugins or personal Claude Code, Codex or Antigravity configuration.

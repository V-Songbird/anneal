# Contributing

Anneal is part of the [Foundry marketplace](https://github.com/V-Songbird/foundry) and has a single maintainer. Contributions are welcome as bug reports, suggestions and pull requests.

One package serves Claude Code, Codex and Antigravity.

---

## Before opening a PR

- Check existing issues first. The problem may already be tracked or deliberately deferred.
- For a substantial change, such as a new skill or a significant refactor, open an issue first to agree on direction.
- Branch from `main` and open the pull request against `main`.

---

## Structure

```text
.claude-plugin/
└── plugin.json          # Claude Code metadata and version
.codex-plugin/
└── plugin.json          # Codex metadata and version; points Codex at its hook file
plugin.json              # Antigravity metadata and the same version
hooks.json               # Antigravity event wiring, keyed by the plugin name
.github/
├── dependabot.yml       # the weekly update of pinned actions
└── workflows/
    └── test.yml         # CI: runs the test suite
CONTRIBUTING.md          # this file
SECURITY.md              # how to report a vulnerability
LICENSE                  # MIT
README.md                # the front page: what it is, install, settings, results
assets/                  # the icons the manifests name, the banners, host cards,
                         # Ember scene and evidence graphics the README shows
docs/
└── knowledge/           # how-it-works.md, install.md, settings.md, limits.md and benchmarks.md
skills/                  # overview, repo-layout, repo-docs and session-review
└── <skill>/
    ├── SKILL.md         # skill definition
    ├── agents/          # Codex display name and default prompt
    ├── assets/          # the skill's icon
    └── references/      # reference files loaded by the skill
agents/
└── mapper.md            # the read-only layout surveyor the repo-layout skill starts
hooks/
├── hooks.json           # Claude Code hook wiring
├── codex-hooks.json     # Codex hook wiring
├── safety-guard.js      # the Git guard
├── instruction-guard.js # the instruction guard
└── session-start-records.js
scripts/                 # the audit, documentation, README and session-evidence scripts
└── git-hooks/           # the commit gates, shared with the other Foundry plugins
templates/               # the documentation rule and ignore rules `repo-docs adopt` writes
evals/                   # eval cases for `claude plugin eval`, with their fixtures and graders
tests/                   # Node tests
```

The README is the front page. The pages under `docs/knowledge/` hold the detail it links, and a fact lives in one place: the README states the short form and links the page. The README names the host beside every host-specific instruction and result.

---

## What to keep in mind

**No Anneal command edits a project on its bare name.** Audits report, and every change waits for the owner's approval of that step.

**Skills are instruction files read by every host.** A change to a `SKILL.md` changes how Claude Code, Codex and Antigravity read the skill. Be precise, and try the affected skill in a real session of each host before a release. A plugin skill carries no `license` and no `metadata.version`; the manifests hold them.

**Hooks run on matching tool calls and session events.** Keep them fast, keep network calls out, and test on Windows, Linux and macOS. A new hook event needs an entry in `hooks/hooks.json`, `hooks/codex-hooks.json` and, when Antigravity has the event, the root `hooks.json`. Codex users must review and trust a new or changed hook in `/hooks`; say so in the release notes.

**The root `plugin.json` is Antigravity's manifest.** It carries no `$schema` and no `com.openai` extension, so Codex keeps reading `.codex-plugin/plugin.json` and finds its hooks.

**Root JavaScript is CommonJS.** Keep new scripts, hooks and tests in that module format.

**A public file names another project only where it was measured.** It states only numbers that were measured.

**Published figures follow one rule.** Each result names its host, model, date and sample size. Losses and limits stay, a host with no results shows `Not measured`, and a result from one host never stands for another.

---

## Tests

Run the suite before submitting:

```bash
node --test
node scripts/git-hooks/check-readme-nav.js
```

It needs Node.js 22 or later, Git and no dependency installation. CI runs it on Windows, Linux and macOS with Node.js 22. A pull request that changes behavior without updating its tests is not merged. Include regression coverage for changed script or hook behavior.

The suite feeds each hook the events a host sends and grades the eval cases without a model. It does not establish that a Claude Code, Codex or Antigravity installation has enabled or trusted the hooks; only a session on that host shows that. `node scripts/audit.js --root .` runs Anneal's own navigation audit on this repository. `node scripts/git-hooks/check-readme-nav.js` checks the README's navigation line and every heading anchor linked from a tracked Markdown file.

Validate the package for each host when you can:

- **Claude Code:** `claude plugin validate .` checks the package shape.
- **Codex:** the suite checks that `.codex-plugin/plugin.json` carries the same version as the other manifests.
- **Antigravity:** `agy plugin validate .` checks the package. It warns that `hooks/hooks.json`, Claude Code's file, is never loaded.

### Eval cases

The eval cases under `evals/` start paid model sessions through `claude plugin eval`, which needs a sandbox that native Windows lacks. Run it under WSL2 or Linux with `bubblewrap` and `socat`. Run it from the repository root, with the results outside it:

```bash
claude plugin eval . --tag smoke --tag safety --scaffold --no-publish --allow-tools Bash Edit Write --output-dir <results>
```

Each case folder holds its prompt, fixture script and graders. `tests/eval-graders.test.js` checks the graders offline against replayed fixtures.

### Pitfalls

- Navigation findings are heuristic. The runtime-name examples in `tests/audit.test.js` exercise the detector on purpose, and the audit also reports two matches in `scripts/session-evidence-navigation.js`.
- `tests/eval-harness.js` has a twin: Collet keeps the same file as `tests/eval-harness.cjs`. Change both together, since no test compares the two repositories.
- Three eval graders hold regex text in their frontmatter that a Markdown link checker takes for seven links. Tests pin the patterns, so exclude `graders/` from such a check instead of changing them.
- On Node.js 22 a suite that fails outside its tests, in a `describe` callback or an `after` hook that throws, can still exit 0.
- Some write tools turn a `\u` escape back into the raw character. After writing an invisible-character escape, check that the file still holds the escape.

---

## Git hooks

Run this once after cloning:

```bash
git config core.hooksPath scripts/git-hooks
```

The `pre-commit` hook runs `node --test tests/*.test.js` and blocks the commit on failure. It also blocks a commit that stages a Markdown file while the root `README.md` lacks its navigation line, or while a link to a heading anchor in any tracked Markdown file no longer resolves.

Every Foundry plugin keeps byte-identical copies of the commit gates under `scripts/git-hooks/` and of the tests that cover them. A change to one goes into all of them.

Keep credentials and personal session data out of commits.

---

## Release notes

Release notes live on the [releases page](https://github.com/V-Songbird/anneal/releases). Describe every user-visible change in your pull request, so it can go into the next release's notes.

The version lives in `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` and `plugin.json`. Change them together; the suite fails when they differ.

A pull request never changes a contributor's installed plugins or personal configuration.

---

## Code of conduct

This project follows the [Contributor Covenant 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). To report behavior that goes against it, contact the maintainer privately through the address in [SECURITY.md](SECURITY.md).

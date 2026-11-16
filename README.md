<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/banner-dark.png" />
    <img src="assets/banner-light.png" alt="anneal" width="900" />
  </picture>
  <h1>anneal</h1>
  <p><strong>Help coding agents find their way around an existing project.</strong></p>
</div>

<p align="center"><strong>Available on</strong></p>
<table align="center">
  <tr>
    <td align="center"><a href="#claude-code"><img src="assets/edition-claude.svg" alt="" width="80" height="80" /><br />Claude Code, primary host</a></td>
    <td align="center"><a href="#codex"><img src="assets/edition-codex.svg" alt="" width="80" height="80" /><br />Codex</a></td>
    <td align="center"><a href="#antigravity"><img src="assets/edition-antigravity.svg" alt="" width="80" height="80" /><br />Antigravity</a></td>
  </tr>
</table>

<p align="center"><a href="#install"><strong>Get started</strong></a> · <a href="#what-is-this">What is this?</a> · <a href="#how-it-works">How it works</a> · <a href="#what-you-can-do">What you can do</a> · <a href="#the-numbers">Evidence</a></p>

## What is this?

Three packages have a discount function, and nothing says which one checkout uses. An agent reads two wrong ones first. This is an illustration, not a measurement.

anneal finds what makes an agent search or guess more than it needs to. Use it on an existing project.

<p align="center"><img src="assets/mascot.svg" alt="Ember stands among three folders that each hold a discount.js. A short map names cart/discount.js, and Ember points at it." width="700"></p>

Ask for an audit with no edits. anneal lists what slows an agent down, with counts and example paths, and changes no file.

## Why you'd want it

- **A short map instead of a search.**
- **One command** for a step sessions keep repeating.
- **Documentation** that matches the code.
- **Nothing changes without your yes.**

## How it works

Each skill runs a script that reads your repository or a transcript, then reports. The scripts use no model.

| Skill | What it does | Changes files? |
| --- | --- | --- |
| `overview` | Says what anneal finds here and which skill to run next | Never |
| `repo-layout` | Audits layout, or plans a migration | Only steps you approve |
| `session-review` | Reviews one session, or finds steps many sessions repeat | Only changes you choose |
| `repo-docs` | Reports where documentation disagrees with behavior | Only with `fix` or a cleanup request |

[How anneal works](docs/knowledge/how-it-works.md) lists every finding, option and hook.

## What you can do

Claude Code syntax shown; Codex uses `$<skill-name>`, Antigravity `/<skill-name>`.

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

Run the scan directly from the plugin folder; `--json` adds the evidence behind each count:

```shell
node scripts/audit.js --root "<your-repository>"
```

### Settings

| Setting | Values | Effect |
| --- | --- | --- |
| `ANNEAL_SESSION_REPORT` | `off`, `0` or `false` | Turns off the session-start line. Set it in the `env` block of Claude Code's `settings.json` or in the shell that starts the host. A running host does not pick up a new shell. Any other value leaves it on |
| `CLAUDE_CONFIG_DIR`, `CODEX_HOME`, `CLAUDE_PROJECT_DIR` | a folder | Read as the host sets them, not anneal settings: the homes (defaults `~/.claude`, `~/.codex`) for global files, memory and transcripts, and the project the session-start line reads (default the working folder, or the top of its Git tree) |

[Script options](docs/knowledge/how-it-works.md#script-options) lists each script's flags.

## Install

Every host needs Node.js 22 or later; confirm `node --version`. A migration also needs a commit, a clean tree and `git config user.email`; audit mode does not.

### Claude Code

Requirements: Node.js 22 or later, Git and Claude Code 2.1.323 or later.

```text
/plugin marketplace add V-Songbird/foundry
/plugin install anneal@foundry
```

Start a new session. In a terminal, `claude plugin list` names `anneal` once installed.

### Codex

Requirements: Git and a Codex host with plugin support.

```text
codex plugin marketplace add V-Songbird/foundry
codex plugin add anneal@foundry
```

In `/hooks`, trust the `SessionStart` hook and the two `PreToolUse` hooks; a changed hook needs [another review](https://learn.chatgpt.com/docs/hooks#review-and-trust-hooks). Then start a new session.

### Antigravity

Requirements: Git and the Antigravity CLI. Antigravity has no marketplace, so install from a Foundry clone. Replace `<path-to-clone>` with a directory:

```shell
git clone --recurse-submodules https://github.com/V-Songbird/foundry.git <path-to-clone>
agy plugin install <path-to-clone>/anneal
agy plugin list
```

The list names `anneal`; if not, install again. Start a new conversation. With `--sandbox`, headless `agy` runs no shell command.

### Update

In Claude Code, then a new session:

```text
/plugin marketplace update foundry
/plugin update anneal@foundry
```

In Codex, review changed hooks in `/hooks`, then a new session:

```text
codex plugin marketplace upgrade
codex plugin add anneal@foundry
```

Antigravity installs a copy, so pull and install again:

```shell
git -C <path-to-clone> pull
git -C <path-to-clone> submodule update --init
agy plugin install <path-to-clone>/anneal
```

## Good to know

> **Experimental.** No support or stability promise. It can change or disappear without a migration path.

- Findings are heuristics; framework conventions and project instructions take precedence.
- A map's paths are matched, not what its sentences mean.
- Import rewriting covers relative imports and `require()` in JavaScript and TypeScript. Other languages, aliases and documents need review. Runtime-built names are never rewritten.
- A session audit reads one session. Its causes rest on names, paths and order.
- The many-sessions pass matches text and has run only in eval cases. Antigravity reads only files you hand it.
- The overview has not run live on any host.
- A host format change can break transcript parsing. Close-out reads Claude Code transcripts only.
- Redaction is best effort, and the session file path is copied unredacted.
- Documentation checks do not prove every claim safe or scan Git history.
- A migration that moves files is unverified on Codex. A live hook refusal is unverified everywhere.
- A sandbox can hide an ignore file; the audit names it in a `limitation:` line.

[Limits](docs/knowledge/how-it-works.md#limits) holds the full list with its details.

## The numbers

### Claude Code results

The first table compares two map files. No session in it loaded the plugin.

<!-- foundry:evidence {"platform":"Claude","status":"measured","models":["Claude Opus 5"],"source":"docs/knowledge/benchmarks.md","date":"unknown","dateReason":"The run date is not recorded.","revision":"not recorded","revisionReason":"The commit the run used is not recorded.","reviewedAt":"2026-11-16"} -->
| Model | Map file | Correct runs | Contract characters read | Contract task cost |
| --- | --- | --- | --- | --- |
| Claude Opus 5 | Original | 6/6 | About 123,000 | $1.10 |
| Claude Opus 5 | With two `Start here` lines | 6/6 | About 31,000 | $0.68 |

<p align="center"><img src="assets/hero.svg" alt="Contract characters read: about 123,000 with the original map file, about 31,000 with two Start here lines. Both scored 6 of 6. No run loaded the plugin." width="700"></p>

The runs with the lines took 58 seconds against 45. Two runs per arm cannot show a small effect.

The newest table: 2026-11-09, Claude Agent SDK, `claude-opus-5-5`, 15 cases, three runs per arm.

<!-- foundry:evidence {"platform":"Claude","status":"measured","models":["Claude Opus 5.5"],"source":"docs/knowledge/benchmarks.md","date":"2026-11-09","revision":"not recorded","revisionReason":"The commit the run used is not recorded.","reviewedAt":"2026-11-16"} -->
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

With anneal, 13 of 15 cases passed every grader in all three runs. Three runs per arm are exploratory.

**Where anneal lost.** A help-page review scored a reply grader 1 of 3 with the plugin and 3 of 3 without. One migration case stopped in every run with the plugin, for lack of a Git identity. One migration step cost $0.58 and 66 seconds with anneal, against $0.27 and 22 seconds without.

<details>
<summary>Replay one recorded audit on Claude Opus 5.5, 2026-11-16, 20 seconds, 8 of 8 graders passed</summary>

<p align="center"><img src="assets/demo.svg" alt="One session, not a comparison. Asked for navigation problems with no edits, anneal names three of six: no map file, an unignored build folder and two same-name files. It changed no files." width="700"></p>

</details>

[anneal benchmarks](docs/knowledge/benchmarks.md) has every batch.

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

## Going deeper

[How anneal works](docs/knowledge/how-it-works.md) · [anneal benchmarks](docs/knowledge/benchmarks.md)

[Release notes](https://github.com/V-Songbird/anneal/releases) · [Foundry](https://github.com/V-Songbird/foundry) · [SECURITY.md](SECURITY.md) · [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT, see [LICENSE](LICENSE).

<div align="center">
  <img src="assets/banner-light.png#gh-light-mode-only" alt="Anneal" width="900" />
  <img src="assets/banner-dark.png#gh-dark-mode-only" alt="Anneal" width="900" />
  <h1>Anneal</h1>
  <p><strong>Help coding agents find their way around an existing project.</strong></p>
</div>

<p align="center"><strong>Available on</strong></p>
<table align="center">
  <tr>
    <td align="center"><a href="#install"><img src="assets/edition-claude.svg" alt="" width="80" height="80" /><br />Claude Code</a></td>
    <td align="center"><a href="docs/knowledge/install.md#codex"><img src="assets/edition-codex.svg" alt="" width="80" height="80" /><br />Codex</a></td>
    <td align="center"><a href="docs/knowledge/install.md#antigravity"><img src="assets/edition-antigravity.svg" alt="" width="80" height="80" /><br />Antigravity</a></td>
  </tr>
</table>

<p align="center"><a href="#install"><strong>Install</strong></a> · <a href="#how-to-use-it">How to use it</a> · <a href="#does-it-work">Does it work?</a> · <a href="#learn-more">Learn more</a></p>

## What does it do?

Anneal is an add-on for Claude Code, the AI assistant that writes code for you. It helps the assistant find its way around a project.

Say three folders each hold a discount file. Nothing says which one checkout uses, so the assistant reads two wrong ones first.

Anneal finds what makes the assistant search or guess too much. It changes nothing without your yes.

<p align="center"><img src="assets/mascot.svg" alt="Ember stands among three folders that each hold a discount.js. A short map names cart/discount.js, and Ember points at it." width="700"></p>

*Ember is the mascot of the Foundry plugins. The scene is an illustration, not a measurement.*

**You ask:** "What makes this project hard to navigate? Change nothing."

**You get:** a list of what slows the assistant down, with example paths. No file changes. This is an illustration.

## Install

You need Claude Code 2.1.323 or later, [Node.js](https://nodejs.org) 22 or later, and Git. Node.js runs Anneal's helpers. Git keeps a history of your files.

1. Open Claude Code.
2. Type these two lines, one at a time:

   ```text
   /plugin marketplace add V-Songbird/foundry
   /plugin install anneal@foundry
   ```

3. Start a new session.

To check that it worked, run `claude plugin list` in a terminal. The list names `anneal`.

Using Codex or Antigravity? Follow the [install guide](docs/knowledge/install.md).

To get a new version, follow [Update](docs/knowledge/install.md#update).

## How to use it

- **`/anneal:overview`** shows what Anneal finds and what to run next.
- **`/anneal:repo-layout audit`** lists what slows the assistant down. It changes nothing.
- **`/anneal:repo-layout`** plans a cleanup, and you approve each step.
- **`/anneal:session-review`** reads one past session and proposes changes to your instructions.
- **`/anneal:repo-docs`** reports where your docs disagree with the code.

Codex and Antigravity use [other names](docs/knowledge/how-it-works.md#what-you-can-do). The one setting is in [Anneal settings](docs/knowledge/settings.md).

## Does it work?

In recorded test sessions on Claude Code with Claude Opus 5, two `Start here` lines in a project's map file cut what the assistant read. It read about 31,000 characters, against about 123,000. All 12 sessions were correct. None loaded Anneal. The run date is not recorded.

<p align="center"><img src="assets/hero.svg" alt="Contract characters read: about 123,000 with the original map file, about 31,000 with two Start here lines. Both scored 6 of 6. No run loaded the plugin." width="700"></p>

**The sessions with the lines took 58 seconds against 45.** Two runs each way cannot show a small effect.

A test of Anneal itself ran on November 9, 2026, with Claude Opus 5.5. In 13 of 15 cases, every check passed in all three runs, a small exploratory sample. **Anneal lost in three places.** No Codex or Antigravity session has been measured yet. Results vary between runs.

[Anneal benchmarks](docs/knowledge/benchmarks.md) has every batch and each loss.

## Good to know

Anneal is experimental. It has no support or stability promise, and it can change or disappear.

- **Findings are estimates.** Your framework's habits come first.
- **Moving files is partly automatic.** Anneal fixes some imports. Review the rest.
- **Moving files is unverified on Codex.**
- **Hiding private details is best effort.** Read a session excerpt before you share it.

[Anneal limits](docs/knowledge/limits.md) lists every limit in full.

## Learn more

[How Anneal works](docs/knowledge/how-it-works.md) · [Install and update](docs/knowledge/install.md) · [Anneal settings](docs/knowledge/settings.md) · [Anneal limits](docs/knowledge/limits.md) · [Anneal benchmarks](docs/knowledge/benchmarks.md)

Release notes are on the [Anneal releases page](https://github.com/V-Songbird/anneal/releases). Report a bug on [Anneal's issue tracker](https://github.com/V-Songbird/anneal/issues), a vulnerability as [SECURITY.md](SECURITY.md) says. To change Anneal, read [CONTRIBUTING.md](CONTRIBUTING.md). [Foundry](https://github.com/V-Songbird/foundry) lists the whole family.

## License

MIT, see [LICENSE](LICENSE).

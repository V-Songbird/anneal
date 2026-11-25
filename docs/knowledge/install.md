---
type: knowledge
summary: "How to install Anneal in Claude Code, Codex and Antigravity, check that it worked and update it to a new release, with what each host needs."
related_files:
  - README.md
  - .claude-plugin/plugin.json
  - .codex-plugin/plugin.json
  - plugin.json
---

# Install and update Anneal

This page says how to install Anneal on each host, how to tell it worked and how to move to a new release. The short form is in the README, under [Install](../../README.md#install).

Every host needs Node.js 22 or later; confirm `node --version`. A migration, which moves files, also needs a commit, a clean tree and `git config user.email`. An audit does not.

## Claude Code

You need Claude Code 2.1.323 or later, and Git.

Inside Claude Code, run:

```text
/plugin marketplace add V-Songbird/foundry
/plugin install anneal@foundry
```

Then start a new session.

To check that it worked, run `claude plugin list` in a terminal. The list names `anneal`.

## Codex

You need a Codex host with plugin support, and Git.

In a terminal, run:

```text
codex plugin marketplace add V-Songbird/foundry
codex plugin add anneal@foundry
```

In `/hooks`, trust the `SessionStart` hook and the two `PreToolUse` hooks. A hook is a program the host runs, and [Codex hook trust](https://learn.chatgpt.com/docs/hooks#review-and-trust-hooks) says a changed one needs another review. Then start a new session.

To check that it worked, run `codex plugin list --marketplace foundry` in a terminal. The list names `anneal`.

## Antigravity

You need the Antigravity CLI, and Git. It has no marketplace for third-party plugins, so you install from a copy of the Foundry repository. Replace `<path-to-clone>` with a folder of your choice.

In a terminal, run:

```shell
git clone --recurse-submodules https://github.com/V-Songbird/foundry.git <path-to-clone>
agy plugin install <path-to-clone>/anneal
agy plugin list
```

Then start a new conversation. The list names `anneal` when it worked.

## Update

### Claude Code

In Claude Code, run these. Then start a new session:

```text
/plugin marketplace update foundry
/plugin update anneal@foundry
```

### Codex

In Codex, run these. Then start a new session. A changed hook stays off until you trust it again in `/hooks`:

```text
codex plugin marketplace upgrade
codex plugin remove anneal@foundry
codex plugin add anneal@foundry
```

### Antigravity

In Antigravity, run these. Then start a new conversation:

```shell
git -C <path-to-clone> pull
git -C <path-to-clone> submodule update --init
agy plugin install <path-to-clone>/anneal
```

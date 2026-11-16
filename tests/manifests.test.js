"use strict";

// The three host manifests describe one plugin: the same name, version,
// description and author, and hook
// commands whose scripts exist. A host reads only its own manifest, so nothing
// else notices when one of them falls behind.

const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const json = (file) => JSON.parse(read(file));
const MANIFESTS = [".claude-plugin/plugin.json", ".codex-plugin/plugin.json", "plugin.json"];

test("the three manifests agree on name, version, description and author", () => {
  const [first, ...rest] = MANIFESTS.map(json);
  assert.match(first.version, /^\d+\.\d+\.\d+(?:-[\w.]+)?$/, `${MANIFESTS[0]} version`);
  for (const [index, manifest] of rest.entries()) {
    for (const field of ["name", "version", "description"]) {
      assert.equal(manifest[field], first[field], `${MANIFESTS[index + 1]} ${field} differs`);
    }
    assert.equal(manifest.author.name, first.author.name, `${MANIFESTS[index + 1]} author differs`);
    assert.equal(manifest.author.email, first.author.email, `${MANIFESTS[index + 1]} author differs`);
  }
});

// Antigravity reads the root manifest. With the portable schema or a Codex
// extension in it, Codex would stop reading .codex-plugin/plugin.json.
test("the root manifest selects no portable loader", () => {
  const root = json("plugin.json");
  assert.equal(Object.hasOwn(root, "$schema"), false);
  assert.equal(Object.hasOwn(root.extensions ?? {}, "com.openai"), false);
});

test("every hook command names a script that exists", () => {
  const name = json("plugin.json").name;
  const scripts = [];
  const each = (events, script) => {
    assert.ok(events && Object.keys(events).length, "a hook file has no events");
    for (const groups of Object.values(events)) for (const group of groups) for (const hook of group.hooks) scripts.push(script(hook));
  };
  each(json("hooks/hooks.json").hooks, (hook) => hook.args?.[0]?.replace("${CLAUDE_PLUGIN_ROOT}/", ""));
  each(json(json(".codex-plugin/plugin.json").hooks).hooks, (hook) => /^node "\$\{PLUGIN_ROOT\}\/([^"]+)"/.exec(hook.command)?.[1]);
  each(json("hooks.json")[name], (hook) => /^node \.\/(\S+)/.exec(hook.command)?.[1]);
  for (const script of scripts) {
    assert.ok(script && fs.statSync(path.join(ROOT, script)).isFile(), `hook script missing: ${script}`);
  }
});

test("every skill folder holds a SKILL.md", () => {
  const skills = fs.readdirSync(path.join(ROOT, "skills"), { withFileTypes: true }).filter((entry) => entry.isDirectory());
  assert.ok(skills.length);
  for (const skill of skills) assert.ok(fs.existsSync(path.join(ROOT, "skills", skill.name, "SKILL.md")), skill.name);
});

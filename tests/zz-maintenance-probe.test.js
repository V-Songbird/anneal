"use strict";

// TEMPORARY PROBE, never merged. Question: why did fs.cpSync of a freshly
// committed fixture fail once on macOS with ENOENT on .git/objects (run
// 43833308259)? Hypothesis: after a commit Git starts a detached
// `git maintenance run --auto`, which holds .git/objects/maintenance.lock for a
// moment; a copy that lists the lock and then finds it gone fails.
// Prediction: on macOS the "default" arm shows the lock or a failed copy in at
// least one of the iterations, and the "off" arm (maintenance.auto=false,
// gc.auto=0) shows neither. Refuted if the default arm shows neither, or the
// off arm shows either.

const { test } = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ITERATIONS = 250;

function arm(name, extraConfig) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), `anneal-probe-${name}-`));
  const config = path.join(base, "gitconfig");
  fs.writeFileSync(config, `[core]\n\tlongpaths = true\n${extraConfig}`);
  const env = { ...process.env, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: config };
  const git = (dir, ...args) => execFileSync("git", ["-c", "user.name=eval", "-c", "user.email=eval@example.invalid", ...args], { cwd: dir, env, stdio: "pipe" });
  let lockSeen = 0;
  const copyErrors = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const repo = path.join(base, `repo-${i}`);
    fs.mkdirSync(path.join(repo, "src"), { recursive: true });
    git(repo, "init", "-q");
    fs.writeFileSync(path.join(repo, "src", "utils.js"), `module.exports = ${i};\n`);
    fs.writeFileSync(path.join(repo, "package.json"), "{}\n");
    git(repo, "add", "src", "package.json");
    git(repo, "commit", "-qm", "initial");
    if (fs.readdirSync(path.join(repo, ".git", "objects")).some((entry) => entry.includes("maintenance"))) lockSeen++;
    try {
      fs.cpSync(repo, path.join(base, `copy-${i}`), { recursive: true });
    } catch (error) {
      copyErrors.push(`${error.code}: ${String(error.message).replace(base, "<base>")}`);
    }
  }
  fs.rmSync(base, { recursive: true, force: true });
  return { name, iterations: ITERATIONS, lockSeen, copyErrors: copyErrors.length, firstErrors: copyErrors.slice(0, 3) };
}

test("probe: a copy right after a commit, with and without Git's auto maintenance", () => {
  const gitVersion = execFileSync("git", ["--version"], { encoding: "utf8" }).trim();
  const results = [arm("default", ""), arm("off", "[maintenance]\n\tauto = false\n[gc]\n\tauto = 0\n")];
  console.log(`PROBE-RESULT ${JSON.stringify({ platform: process.platform, node: process.version, gitVersion, results })}`);
});

"use strict";

// The unused-tools report on synthetic Claude Code transcripts in a temporary Git repository: what counts as listed,
// what counts as a call, what it never lists, the lines it offers to paste, and its exit codes.

const { test, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync, spawnSync } = require("node:child_process");
const { tempDir, transcript, at, human, use, result, say, call } = require("./session-transcripts.js");
const { listedSkills } = require("../scripts/session-tools.js");

const CLI = path.join(__dirname, "..", "scripts", "session-tools.js");

process.env.GIT_CONFIG_NOSYSTEM = "1";
process.env.GIT_CONFIG_GLOBAL = path.join(tempDir(), "config");
fs.writeFileSync(process.env.GIT_CONFIG_GLOBAL, "[core]\n\tlongpaths = true\n");

// The script never reads this run's own session, nor a host home the test did not hand it.
const ENV = { ...process.env };
for (const name of ["CLAUDE_CODE_SESSION_ID", "CODEX_THREAD_ID", "CLAUDE_CONFIG_DIR", "CODEX_HOME"]) delete ENV[name];
const EMPTY = tempDir();

const run = (args, env = {}) => spawnSync(process.execPath, [CLI, "--claude-home", EMPTY, ...args], { encoding: "utf8", env: { ...ENV, ...env } });

function report(args, env) {
  const ran = run(args, env);
  assert.strictEqual(ran.status, 0, ran.stderr);
  return JSON.parse(ran.stdout);
}

function shop() {
  const dir = path.join(tempDir(), "shop");
  fs.mkdirSync(dir);
  execFileSync("git", ["-c", "core.longpaths=true", "init", "-q"], { cwd: dir, stdio: "pipe" });
  return dir;
}

const ids = [1, 2, 3, 4].map((n) => `0a1b2c3d-0000-4000-8000-00000000000${n}`);
const tool = (name, description = "x") => ({ name, description, schema: { type: "object" } });
const TOOLS = [tool("Bash"), tool("Read"), tool("ScheduleWakeup", "y".repeat(400)), tool("mcp__paint__draw")];
const SKILLS = { deploy: "Ships the build.", "kit:lint": "Checks: style, then types.", pdf: "Reads PDF files." };

const snapshot = (tools, second = 1) => ({ type: "attachment", timestamp: at(second), attachment: { type: "prompt_snapshot", systemPrompt: [], tools } });
const listing = (skills, second = 1, names = true) => ({
  type: "attachment", timestamp: at(second),
  attachment: {
    type: "skill_listing", content: Object.entries(skills).map(([name, text]) => `- ${name}: ${text}`).join("\n"),
    ...(names ? { names: Object.keys(skills) } : {}),
  },
});

// One session: what the host listed, then each call with its result.
function session(dir, index, calls, { rows = [], tools = TOOLS, skills = SKILLS } = {}) {
  const lines = [{ ...human(`Task ${index}.`, 1), sessionId: ids[index] }, snapshot(tools), listing(skills)];
  calls.forEach(([name, input], n) => lines.push(use(`t${index}-${n}`, name, input, 2 + n * 2), result(`t${index}-${n}`, "ok", 3 + n * 2)));
  lines.push(...rows, say(`end-${index}`, "Done.", 50));
  return transcript(lines, { dir, name: `${ids[index]}.jsonl` });
}

const names = (rows) => rows.map((row) => row.name);

describe("session-tools.js", () => {
  test("lists a tool and a skill every session was sent and none called", () => {
    const root = shop();
    const dir = tempDir();
    session(dir, 0, [["Bash", { command: "ls" }], ["Skill", { skill: "deploy" }]]);
    session(dir, 1, [["Read", { file_path: "a.js" }]]);
    session(dir, 2, [["Bash", { command: "ls" }]]);
    const out = report(["--root", root, "--sessions-dir", dir]);
    assert.deepStrictEqual(out.sessionsRead, { sessions: 3, withToolListing: 3, withSkillListing: 3, subagentTranscripts: 0 });
    assert.deepStrictEqual(out.unusedTools, [{ name: "ScheduleWakeup", chars: JSON.stringify(TOOLS[2]).length, sessionsListed: 3 }]);
    assert.deepStrictEqual(names(out.unusedSkills), ["kit:lint", "pdf"]);
    assert.strictEqual(out.unusedSkills[0].chars, SKILLS["kit:lint"].length);
    assert.deepStrictEqual(out.paste, {
      tools: { permissions: { deny: ["ScheduleWakeup"] } },
      skills: { skillOverrides: { "kit:lint": "name-only", pdf: "name-only" } },
    });
    assert.deepStrictEqual(out.dates, { first: at(2), last: at(50) });
  });

  test("never lists a tool server's tool, and counts it", () => {
    const root = shop();
    const dir = tempDir();
    for (const index of [0, 1, 2]) session(dir, index, [["Bash", { command: "ls" }], ["Read", { file_path: "a.js" }], ["ScheduleWakeup", {}]]);
    const out = report(["--root", root, "--sessions-dir", dir]);
    assert.deepStrictEqual(out.unusedTools, []);
    assert.strictEqual(out.omitted.toolServerTools, 1);
    assert.strictEqual(out.paste.tools, null);
  });

  test("a typed slash command and a subagent's call both count as use", () => {
    const root = shop();
    const dir = tempDir();
    const typed = { ...human("<command-name>/kit:lint</command-name>", 40), uuid: "u-1" };
    session(dir, 0, [["Bash", { command: "ls" }], ["Read", { file_path: "a.js" }]], { rows: [typed] });
    session(dir, 1, [["Skill", { skill: "/pdf" }]]);
    session(dir, 2, []);
    transcript([use("sub-1", "ScheduleWakeup", {}, 5), result("sub-1", "ok", 6)], { dir: path.join(dir, ids[2], "subagents"), name: "agent-a1.jsonl" });
    const out = report(["--root", root, "--sessions-dir", dir]);
    assert.strictEqual(out.sessionsRead.subagentTranscripts, 1);
    assert.deepStrictEqual(out.unusedTools, []);
    assert.deepStrictEqual(names(out.unusedSkills), ["deploy"]);
  });

  test("a listing in fewer sessions than --min-sessions is left out, and --limit keeps the largest", () => {
    const root = shop();
    const dir = tempDir();
    session(dir, 0, [], { tools: [...TOOLS, tool("Rare", "z".repeat(900))] });
    session(dir, 1, []);
    session(dir, 2, []);
    const out = report(["--root", root, "--sessions-dir", dir]);
    assert.ok(!names(out.unusedTools).includes("Rare"));
    const one = report(["--root", root, "--sessions-dir", dir, "--min-sessions", "1", "--limit", "1"]);
    assert.deepStrictEqual(names(one.unusedTools), ["Rare"]);
    assert.strictEqual(one.omitted.tools, 3);
  });

  test("a call a resumed session copied counts once, and a session without a listing adds only calls", () => {
    const root = shop();
    const dir = tempDir();
    session(dir, 0, [["Bash", { command: "ls" }]]);
    session(dir, 1, []);
    session(dir, 2, []);
    transcript([{ ...human("Go on.", 1), sessionId: ids[3] }, use("t0-0", "Bash", { command: "ls" }, 2), use("late", "ScheduleWakeup", {}, 4)],
      { dir, name: `${ids[3]}.jsonl` });
    const out = report(["--root", root, "--sessions-dir", dir]);
    assert.deepStrictEqual(out.sessionsRead, { sessions: 4, withToolListing: 3, withSkillListing: 3, subagentTranscripts: 0 });
    assert.deepStrictEqual(names(out.unusedTools), ["Read"]);
  });

  test("skips the running session and a Codex rollout, and finds a repository's own sessions", () => {
    const root = shop();
    const home = tempDir();
    const top = execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: root, encoding: "utf8" }).trim();
    const dir = path.join(home, "projects", path.resolve(top).replace(/[^A-Za-z0-9]/g, "-"));
    for (const index of [0, 1, 2, 3]) session(dir, index, []);
    const ran = spawnSync(process.execPath, [CLI, "--root", root, "--claude-home", home], { encoding: "utf8", env: { ...ENV, CLAUDE_CODE_SESSION_ID: ids[3] } });
    assert.strictEqual(ran.status, 0, ran.stderr);
    const out = JSON.parse(ran.stdout);
    assert.strictEqual(out.sessionsRead.sessions, 3);
    assert.deepStrictEqual(out.skipped.map((entry) => entry.reason), ["running-session"]);

    const rollout = transcript([{ timestamp: at(1), type: "session_meta", payload: { id: "x", cwd: root } }, call("c1", "ls", 2)], { name: "rollout.jsonl" });
    const mixed = report(["--root", root, "--session-file", rollout, "--sessions-dir", dir, "--min-sessions", "4"]);
    assert.deepStrictEqual(mixed.skipped.map((entry) => entry.reason), ["not-claude-code"]);
    assert.strictEqual(mixed.sessionsRead.sessions, 4);
  });

  test("reads a listing without names, where a description holds a colon", () => {
    assert.deepStrictEqual([...listedSkills(listing(SKILLS, 1, false).attachment)], Object.entries(SKILLS).map(([name, text]) => [name, text.length]));
    assert.deepStrictEqual([...listedSkills({ content: "- solo" })], [["solo", 0]]);
  });

  test("exits 2 on bad arguments, outside Git and with no session", () => {
    const root = shop();
    assert.strictEqual(run([]).status, 2);
    assert.strictEqual(run(["--root", root, "--limit", "0"]).status, 2);
    assert.strictEqual(run(["--root", root, "--min-sessions", "21"]).status, 2);
    assert.match(run(["--root", tempDir()]).stderr, /not inside a Git work tree/);
    const none = run(["--root", root]);
    assert.strictEqual(none.status, 2);
    assert.match(none.stderr, /no Claude Code session found/);
  });

  test("writes nothing in the repository", () => {
    const root = shop();
    const dir = tempDir();
    for (const index of [0, 1, 2]) session(dir, index, []);
    report(["--root", root, "--sessions-dir", dir]);
    assert.deepStrictEqual(fs.readdirSync(root), [".git"]);
  });
});

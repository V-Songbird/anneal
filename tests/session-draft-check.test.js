"use strict";

// The draft check fails closed and never prints what it found. It runs with a made-up home and account.

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const CHECK = path.join(__dirname, "..", "scripts", "session-draft-check.js");
const ACCOUNT = "quillfen";
const HOME = `/home/${ACCOUNT}`;
const ZERO_WIDTH_SPACE = String.fromCodePoint(0x200b);

describe("session-draft-check", () => {
  let dir;
  let withHome;
  let withoutHome;

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "anneal-draft-"));
    withHome = path.join(dir, "home.js");
    withoutHome = path.join(dir, "no-home.js");
    const user = `os.userInfo = () => ({ username: ${JSON.stringify(ACCOUNT)} });`;
    fs.writeFileSync(withHome, `const os = require("node:os"); os.homedir = () => ${JSON.stringify(HOME)}; ${user}`);
    fs.writeFileSync(withoutHome, `const os = require("node:os"); os.homedir = () => ""; ${user}`);
  });

  after(() => fs.rmSync(dir, { recursive: true, force: true }));

  const run = (input, { args = [], preload = withHome } = {}) => spawnSync(
    process.execPath,
    ["--require", preload, CHECK, ...args],
    { input, encoding: "utf8" },
  );

  const assertHit = (draft, sensitive, expected) => {
    const done = run(draft);
    assert.strictEqual(done.status, 1, done.stderr);
    assert.deepStrictEqual(JSON.parse(done.stdout), { clean: false, hits: [expected] });
    assert.ok(!`${done.stdout}${done.stderr}`.includes(sensitive));
  };

  test("a secret is located and not printed", () => {
    assertHit("first line\napi_key: abcd1234wxyz\n", "abcd1234wxyz", { line: 2, column: 10, length: 12, kind: "secret" });
  });

  test("a home path is one hit and is not printed", () => {
    assertHit(`see ${HOME}/notes.md`, HOME, { line: 1, column: 5, length: HOME.length, kind: "home" });
  });

  test("the account name in a path is located and not printed", () => {
    assertHit(`logs in /srv/${ACCOUNT}/app`, ACCOUNT, { line: 1, column: 14, length: ACCOUNT.length, kind: "account" });
  });

  test("a hidden character is a hit", () => {
    assertHit(`a${ZERO_WIDTH_SPACE}b`, ZERO_WIDTH_SPACE, { line: 1, column: 2, length: 1, kind: "hidden-character" });
  });

  test("text the evidence already redacted passes", () => {
    const done = run("token: [REDACTED] in ~/notes.md, owned by /srv/<user>/app\n");
    assert.strictEqual(done.status, 0, done.stdout);
    assert.deepStrictEqual(JSON.parse(done.stdout), { clean: true, hits: [] });
  });

  test("an unreadable file exits 2 and does not repeat its path", () => {
    const missing = path.join(dir, ACCOUNT, "draft.md");
    const done = run("", { args: [missing] });
    assert.strictEqual(done.status, 2);
    assert.strictEqual(done.stdout, "");
    assert.ok(!done.stderr.includes(ACCOUNT));
  });

  for (const [name, input] of [
    ["invalid UTF-8", Buffer.from([0x61, 0xff, 0x62])],
    ["UTF-16 text", Buffer.from("api_key: abcd1234wxyz", "utf16le")],
    ["an empty draft", ""],
  ]) {
    test(`${name} exits 2`, () => {
      const done = run(input);
      assert.strictEqual(done.status, 2);
      assert.strictEqual(done.stdout, "");
    });
  }

  test("a machine with no home directory exits 2 instead of passing the draft", () => {
    const done = run("plain text", { preload: withoutHome });
    assert.strictEqual(done.status, 2);
    assert.strictEqual(done.stdout, "");
  });
});

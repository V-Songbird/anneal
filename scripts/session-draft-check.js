#!/usr/bin/env node
"use strict";

// Checks a draft before session-review saves or sends it. Reads UTF-8 from a file argument or standard input, and prints
// JSON with each hit's line, column, length and kind, never the text. Exit 0 is no hit, 1 is a hit, and 2 is a draft it
// could not check. A clean result means no known pattern matched, not that the text is safe.

const fs = require("node:fs");
const { draftHits } = require("./session-evidence-redaction.js");

const refuse = (code) => {
  throw Object.assign(new Error(code), { code });
};

function readDraft(args) {
  if (args.length > 1) refuse("expected one file or standard input");
  if (!args.length && process.stdin.isTTY) refuse("no draft on standard input");
  const text = new TextDecoder("utf-8", { fatal: true }).decode(fs.readFileSync(args.length ? args[0] : 0));
  // A NUL means another encoding, such as UTF-16, whose text no pattern would match.
  if (text.includes("\0")) refuse("draft is not UTF-8 text");
  if (!text.trim()) refuse("draft is empty");
  return text;
}

function position(text, index) {
  const before = text.slice(0, index);
  return { line: before.split("\n").length, column: index - before.lastIndexOf("\n") };
}

function main() {
  let text;
  let hits;
  try {
    text = readDraft(process.argv.slice(2));
    hits = draftHits(text);
  } catch (error) {
    // Only the code: a Node error's message repeats the path, which can hold the home directory.
    console.error(`Draft not checked: ${error.code || "internal error"}.`);
    return 2;
  }
  const report = hits.map(({ kind, index, length }) => ({ ...position(text, index), length, kind }));
  console.log(JSON.stringify({ clean: !report.length, hits: report }));
  return report.length ? 1 : 0;
}

process.exitCode = main();

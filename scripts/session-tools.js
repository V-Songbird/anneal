#!/usr/bin/env node
"use strict";

// anneal's unused-tools report: which tools and skills Claude Code listed to the sessions of one repository and no
// session ever called. Each main transcript records what the host sent: a prompt_snapshot attachment holds the tool
// definitions, and a skill_listing attachment the skill descriptions. The script counts calls in the main transcripts
// and their subagent transcripts, and prints JSON: each tool and skill listed in at least --min-sessions sessions and
// called in none, with the size of its definition in characters, and the settings lines the owner could paste.
// Read-only: it writes nothing and never touches a settings file. Claude Code only: a Codex rollout carries no listing.

const fs = require("node:fs");
const path = require("node:path");
const { HOME, directory } = require("./session-evidence-redaction.js");
const { records } = require("./session-evidence-records.js");
const { repositoryPaths, discover, transcriptsIn, subagentsOf } = require("./session-repeats.js");

const COMMAND_NAME = /<command-name>\s*\/([^\s<]+)\s*<\/command-name>/g;

const USAGE = "usage: session-tools.js --root <repository> [--sessions-dir <dir>]... [--session-file <file>]...\n"
  + "       [--claude-home <dir>] [--min-sessions <1-20>] [--limit <1-30>]\n";

function parse(argv) {
  const repeatable = new Set(["--sessions-dir", "--session-file"]);
  const options = { "--sessions-dir": [], "--session-file": [], "--root": null, "--claude-home": null, "--min-sessions": "3", "--limit": "10" };
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i += 2) {
    if (!(args[i] in options) || i + 1 >= args.length) return null;
    if (repeatable.has(args[i])) options[args[i]].push(args[i + 1]);
    else options[args[i]] = args[i + 1];
  }
  return options;
}

// The skills one listing holds, each with the characters of its description. The host writes one `- <name>: <text>`
// item per skill and, in newer versions, the names beside the text; a name can hold a colon, as `plugin:skill` does.
function listedSkills(attachment) {
  const content = typeof attachment.content === "string" ? attachment.content : "";
  const names = Array.isArray(attachment.names) ? new Set(attachment.names.filter((name) => typeof name === "string")) : null;
  const skills = new Map();
  for (const item of content.split(/\n(?=- )/)) {
    if (!item.startsWith("- ")) continue;
    const colon = item.indexOf(": ");
    const name = colon < 0 ? item.slice(2).trim() : item.slice(2, colon);
    if (!name || (names && !names.has(name))) continue;
    skills.set(name, colon < 0 ? 0 : item.length - colon - 2);
  }
  return skills;
}

function text(content) {
  if (typeof content === "string") return content;
  return Array.isArray(content) ? content.map((block) => (block && typeof block.text === "string" ? block.text : "")).join("\n") : "";
}

function main(argv, env = process.env) {
  const options = parse(argv);
  if (!options || options["--root"] === null) return fail(USAGE, 2);
  const minimum = Number(options["--min-sessions"]);
  if (!/^\d+$/.test(options["--min-sessions"]) || minimum < 1 || minimum > 20) return fail("session-tools.js: --min-sessions must be between 1 and 20\n", 2);
  const limit = Number(options["--limit"]);
  if (!/^\d+$/.test(options["--limit"]) || limit < 1 || limit > 30) return fail("session-tools.js: --limit must be between 1 and 30\n", 2);
  const home = options["--claude-home"] || env.CLAUDE_CONFIG_DIR || (HOME ? path.join(HOME, ".claude") : null);
  const root = path.resolve(options["--root"]);
  const paths = repositoryPaths(root);
  if (paths === null) return fail(`session-tools.js: not inside a Git work tree: ${root}\n`, 2);

  const named = options["--session-file"].length || options["--sessions-dir"].length;
  const files = [...new Set((named
    ? [...options["--session-file"], ...options["--sessions-dir"].flatMap((dir) => transcriptsIn(path.resolve(dir)))]
    : discover(paths, { claude: home, codex: null })).map((file) => path.resolve(file)))];
  const searched = named ? [...options["--session-file"], ...options["--sessions-dir"]].map((item) => directory(path.resolve(item)))
    : [`${directory(path.join(home || "", "projects"))} (Claude Code)`];

  // name -> { chars: the largest definition seen, sessions: the sessions that listed it }
  const tools = new Map();
  const skills = new Map();
  const calls = new Map(); // a tool's name to its calls
  const skillCalls = new Map(); // a skill's name to its calls through the Skill tool and its typed slash commands
  const counted = new Set(); // tool_use ids and record uuids already counted: a resumed session copies earlier records
  const skipped = [];
  const read = { sessions: 0, withToolListing: 0, withSkillListing: 0, subagentTranscripts: 0 };
  const dates = { first: null, last: null };
  const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1);
  const list = (map, name, chars, session) => {
    if (!map.has(name)) map.set(name, { chars: 0, sessions: new Set() });
    const entry = map.get(name);
    entry.chars = Math.max(entry.chars, chars);
    entry.sessions.add(session);
  };

  for (const file of files) {
    const id = path.basename(file, ".jsonl");
    if (env.CLAUDE_CODE_SESSION_ID && (id === env.CLAUDE_CODE_SESSION_ID || id.endsWith(`-${env.CLAUDE_CODE_SESSION_ID}`))) {
      skipped.push({ sessionFile: directory(file), reason: "running-session" });
      continue;
    }
    const listed = { tools: false, skills: false };
    let main = true;
    for (const transcript of [file, ...subagentsOf(file)]) {
      let rows;
      try {
        rows = [...records(fs.readFileSync(transcript), new Set())];
      } catch (error) {
        skipped.push({ sessionFile: directory(transcript), reason: "unreadable", message: String(error.message).slice(0, 240) });
        if (main) break;
        continue;
      }
      if (main && rows.length && "payload" in rows[0][1]) {
        skipped.push({ sessionFile: directory(transcript), reason: "not-claude-code" });
        break;
      }
      if (main) read.sessions += 1;
      else read.subagentTranscripts += 1;
      for (const [, row] of rows) {
        const attachment = row.type === "attachment" && row.attachment && typeof row.attachment === "object" ? row.attachment : null;
        // A subagent gets its own tools and skills, so only the main transcript says what the session was sent.
        if (attachment && main && attachment.type === "prompt_snapshot" && Array.isArray(attachment.tools)) {
          for (const tool of attachment.tools) {
            if (tool && typeof tool.name === "string") list(tools, tool.name, JSON.stringify(tool).length, file);
          }
          listed.tools = true;
        } else if (attachment && main && attachment.type === "skill_listing") {
          for (const [name, chars] of listedSkills(attachment)) list(skills, name, chars, file);
          listed.skills = true;
        }
        const message = row.message && typeof row.message === "object" ? row.message : null;
        if (!message) continue;
        if (row.type === "assistant") {
          if (typeof row.timestamp === "string") {
            if (dates.first === null || row.timestamp < dates.first) dates.first = row.timestamp;
            if (dates.last === null || row.timestamp > dates.last) dates.last = row.timestamp;
          }
          for (const block of Array.isArray(message.content) ? message.content : []) {
            if (!block || block.type !== "tool_use" || typeof block.name !== "string") continue;
            if (typeof block.id === "string") {
              if (counted.has(block.id)) continue;
              counted.add(block.id);
            }
            bump(calls, block.name);
            const skill = block.name === "Skill" && block.input && typeof block.input.skill === "string" ? block.input.skill.replace(/^\//, "") : null;
            if (skill) bump(skillCalls, skill);
          }
        } else if (row.type === "user") {
          if (typeof row.uuid === "string") {
            if (counted.has(row.uuid)) continue;
            counted.add(row.uuid);
          }
          for (const [, name] of text(message.content).matchAll(COMMAND_NAME)) bump(skillCalls, name);
        }
      }
      main = false;
    }
    if (listed.tools) read.withToolListing += 1;
    if (listed.skills) read.withSkillListing += 1;
  }
  if (!read.sessions) {
    return fail(`session-tools.js: no Claude Code session found to read. Searched: ${searched.join(", ")}. Supply --session-file or --sessions-dir.\n`, 2);
  }

  // A tool server is switched off whole in its own settings, so its tools are counted and never listed.
  const mcp = [...tools.entries()].filter(([name, entry]) => name.startsWith("mcp__") && entry.sessions.size >= minimum && !calls.has(name));
  const unused = (map, used, keep = () => true) => [...map.entries()]
    .filter(([name, entry]) => keep(name) && entry.sessions.size >= minimum && !used.has(name))
    .map(([name, entry]) => ({ name, chars: entry.chars, sessionsListed: entry.sessions.size }))
    .sort((a, b) => b.chars - a.chars || (a.name < b.name ? -1 : 1));
  const allTools = unused(tools, calls, (name) => !name.startsWith("mcp__"));
  const allSkills = unused(skills, skillCalls);
  const unusedTools = allTools.slice(0, limit);
  const unusedSkills = allSkills.slice(0, limit);
  const output = {
    root: directory(root), sessionsRead: read, dates, skipped,
    listed: { tools: tools.size, skills: skills.size },
    unusedTools, unusedSkills,
    omitted: { tools: allTools.length - unusedTools.length, skills: allSkills.length - unusedSkills.length, toolServerTools: mcp.length },
    paste: {
      tools: unusedTools.length ? { permissions: { deny: unusedTools.map((tool) => tool.name) } } : null,
      skills: unusedSkills.length ? { skillOverrides: Object.fromEntries(unusedSkills.map((skill) => [skill.name, "name-only"])) } : null,
    },
    limits: "A tool or skill is listed when at least --min-sessions sessions were sent it and no session read called it: unused in "
      + "these sessions, which does not mean never needed. A skill counts as called when the Skill tool named it or the owner "
      + "typed its slash command. chars is the largest definition seen, in characters of JSON for a tool and of description for a "
      + "skill; no token count is measured. A session lists only what its host sent it, so a transcript without a listing adds "
      + "calls and no listing. Tools of a tool server (mcp__) are counted in omitted.toolServerTools and never listed. Subagent "
      + "transcripts add calls to their session. The paste lines are for the owner's own Claude Code settings and are never "
      + "written: a denied tool cannot be called at all, and a skill set to name-only keeps its name in the listing, loses its "
      + "description there and can still be invoked. What each setting removes from a request was read from Claude Code's "
      + "behaviour at one version, not measured here.",
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  return 0;
}

function fail(message, code) {
  process.stderr.write(message);
  return code;
}

if (require.main === module) process.exitCode = main(process.argv);

module.exports = { main, listedSkills };

"use strict";

// What session-evidence copies out of a transcript is redacted and bounded: secrets and the home
// directory are masked, characters a reader cannot see are spelled out, and every copied field is
// cut to a bound.

const os = require("node:os");
const { HIDDEN_CHARACTERS } = require("./audit.js");

// The home directory however a shell, a URL or a JSON string spells it, as whole path segments: a
// separator is a slash or a run of backslashes, and a drive also reads as MSYS /c and WSL /mnt/c. A
// sibling such as <home>2 is another directory. Case is ignored for a Windows home, and a root home
// names nobody, so it matches nothing.
function homePattern(home) {
  const trimmed = home.replace(/[\\/]+$/, "");
  if (!trimmed || /^[A-Za-z]:$/.test(trimmed)) return null;
  const segments = trimmed.split(/[\\/]+/).map((segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const drive = /^([A-Za-z]):$/.exec(segments[0]);
  if (drive) segments[0] = `(?:${drive[1]}:|/(?:mnt/)?${drive[1]})`;
  const body = segments.join(String.raw`(?:\\+|/)`);
  const flags = /^(?:[A-Za-z]:|\\\\)/.test(trimmed) ? "giu" : "gu";
  return new RegExp(String.raw`(?<![\p{L}\p{N}_.-])${body}(?![\p{L}\p{N}_-]|\.[\p{L}\p{N}_-])`, flags);
}

// A machine can have no home directory. Then nothing is redacted as one, and no default host home exists.
function homeDirectory() {
  try {
    return os.homedir();
  } catch {
    return "";
  }
}

// The OS user name, or nothing where the OS has none for this process.
function userName() {
  try {
    return os.userInfo().username;
  } catch {
    return "";
  }
}

// The account name, the home directory's last segment and the OS user name when that differs, in the shapes that carry
// it past the home: a whole path segment after a slash or backslash, a part of a Claude project key such as
// C--Users-<name>-shop or -home-<name>-shop, a part of a lowercase folder name built from a path such as
// -mnt-d-projects-<name>-shop, and the owner or group column of an `ls -l` line. A word in prose or code is left alone,
// since an account name can be a common word such as dev, and so is a segment that only contains it, such as <name>2.
// Case is ignored for a Windows home, as the home rule does.
function accountShapes(home) {
  const trimmed = home.replace(/[\\/]+$/, "");
  const flags = /^(?:[A-Za-z]:|\\\\)/.test(trimmed) ? "giu" : "gu";
  const names = [trimmed.split(/[\\/]+/).pop()];
  const user = userName();
  if (user && (flags.includes("i") ? user.toLowerCase() !== names[0].toLowerCase() : user !== names[0])) names.push(user);
  const escape = (name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const any = names.map(escape).join("|");
  // A project key spells every character but an ASCII letter or digit as a hyphen.
  const keyed = names.map((name) => escape(name.replace(/[^A-Za-z0-9]/g, "-"))).join("|");
  return {
    names: new RegExp(`^(?:${any})$`, flags.replace("g", "")),
    segment: new RegExp(String.raw`(?<=[\\/])(?:${any})(?![\p{L}\p{N}_-]|\.[\p{L}\p{N}_-])`, flags),
    key: new RegExp(String.raw`(?<![\p{L}\p{N}_.-])([A-Za-z]--(?:[A-Za-z0-9]+-)*?|-(?:home|Users)-)(?:${keyed})(?=-|(?![\p{L}\p{N}_.]))`, flags),
    // A folder name built from a whole path, lower case, with a hyphen for each separator: a WSL mount such as mnt-d-,
    // a drive such as d--, or home- or users- comes first, and every part between it and the name has two or more
    // characters, so that a longer name such as v-<name> keeps the word. The name is the project key's, in lower case.
    folder: new RegExp(String.raw`(?<![\p{L}\p{N}_.-])(-?(?:[a-z0-9]+-+)*?(?:mnt-[a-z]-|[a-z]--|home-|users-)(?:[a-z0-9]{2,}-+)*?)`
      + String.raw`(?:${keyed.toLowerCase()})(?=-|(?![\p{L}\p{N}_.]))`, "gu"),
    listing: new RegExp(String.raw`(?:^|(?<=\\n))([ \t]*[-bcdlps][-rwxsStT]{9}[.+@]?[ \t]+\d+[ \t]+)(\S+)([ \t]+)(\S+)`, `m${flags}`),
  };
}

const HOME = homeDirectory();
const HOME_PATH = homePattern(HOME);
// Where the home rule masks nothing, neither does the account rule.
const ACCOUNT = HOME_PATH ? accountShapes(HOME) : null;
const PLACEHOLDER = "<user>";

const WORD = /^[A-Za-z][a-z]*(?:[A-Z][a-z]+)*(?:-[A-Za-z][a-z]*(?:[A-Z][a-z]+)*)*$/;

// What follows Bearer or Basic is a credential when it has eight or more characters and is not prose:
// a word shorter than twenty letters, a date or number, a file name, or a path of words.
function isCredential(token) {
  const bare = token.replace(/\.+$/, "");
  return token.length >= 8 && !(bare.length < 20 && WORD.test(bare)) && !/^\d[\d./:-]*$/.test(bare)
    && !/^(?:[\w-]+\/)*[\w-]+\.[A-Za-z][A-Za-z0-9]{0,4}$/.test(bare) && !/^[A-Za-z]+(?:\/[A-Za-z]+)+$/.test(bare);
}

// The redaction patterns here keep ASCII \b edges on purpose. Before a keyword, a non-ASCII letter such as ñ counts
// as an edge, so the ASCII edge errs toward masking: a Unicode edge would let `contraseña_token: …` through.

// A value named as a secret, after a colon or an assignment but never a comparison or an arrow:
// `token === null` is code.
const SECRET_NAME = String.raw`\b(?:[a-z][a-z0-9_]*_)?(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|token)\b`;
const NAMED_SECRET = new RegExp(String.raw`(${SECRET_NAME}["']?\s*(?::=?|=(?![=>]))\s*)("[^"\n]*"|'[^'\n]*'|[^\s,;}&]+)`, "gi");
// A value in that place that is code, not a secret: a type annotation, a literal keyword or a reference
// to an environment variable.
const CODE_VALUE = new RegExp([
  String.raw`^(?:string|number|boolean|bigint|symbol|object|any|unknown|never|void|null|undefined|true|false)$`,
  String.raw`^(?:process\.env|import\.meta\.env|os\.environ)\b`,
  String.raw`^\$\{?[A-Za-z_]\w*\}?$|^%[A-Za-z_]\w*%$`,
].join("|"));

// Characters a transcript can hold that a reader does not see, the ones the audit reports in instruction files, each
// shown as its code point, so an excerpt shows the owner what the session read. A run of Unicode tags is counted
// instead, since its code points spell out the hidden text.
function visible(text) {
  let shown = "";
  let last = 0;
  let tags = 0;
  const flush = () => {
    if (tags) shown += `<${tags} Unicode tag character${tags === 1 ? "" : "s"}>`;
    tags = 0;
  };
  for (const match of text.matchAll(HIDDEN_CHARACTERS)) {
    const code = match[0].codePointAt(0);
    if (match.index > last) {
      flush();
      shown += text.slice(last, match.index);
    }
    if (code >= 0xe0000 && code <= 0xe007f) tags++;
    else {
      flush();
      shown += `<U+${code.toString(16).toUpperCase().padStart(4, "0")}>`;
    }
    last = match.index + match[0].length;
  }
  flush();
  return shown + text.slice(last);
}

// Each rule is a pattern and what a match becomes. redact applies them and draftHits locates them, so the two agree.
const SECRET_RULES = [
  [/\bsk-[A-Za-z0-9_-]{16,}\b/g, () => "[REDACTED]"],
  [/\b(Bearer|Basic)(\s+)([A-Za-z0-9._~+/-]+=*)/gi, (match, scheme, space, token) => (
    isCredential(token) ? `${scheme}${space}[REDACTED]` : match)],
  [/\b((?:set-)?cookie\s*:)\s*[^\r\n]+/gim, (match, name) => `${name} [REDACTED]`],
  [/(https?:\/\/)[^/\s:@]+:[^/\s@]+@/g, (match, scheme) => `${scheme}[REDACTED]@`],
  [/(--(?:api-key|access-token|password|secret|token)\s+)\S+/gi, (match, flag) => `${flag}[REDACTED]`],
  [NAMED_SECRET, (match, name, secret) => (CODE_VALUE.test(secret) ? match : `${name}[REDACTED]`)],
];

const column = (value) => (ACCOUNT.names.test(value) ? PLACEHOLDER : value);
const ACCOUNT_RULES = ACCOUNT ? [
  [ACCOUNT.segment, () => PLACEHOLDER],
  [ACCOUNT.key, (match, lead) => `${lead}${PLACEHOLDER}`],
  [ACCOUNT.folder, (match, lead) => `${lead}${PLACEHOLDER}`],
  [ACCOUNT.listing, (line, lead, owner, gap, group) => `${lead}${column(owner)}${gap}${column(group)}`],
] : [];

const applyRule = (text, [pattern, replace]) => text.replace(pattern, replace);

function redact(value) {
  return visible(withoutAccount(withoutHome(SECRET_RULES.reduce(applyRule, String(value)))));
}

// The home directory shortened to ~, and nothing else changed.
function withoutHome(text) {
  return HOME_PATH ? text.replace(HOME_PATH, "~") : text;
}

// The account name replaced by the placeholder in its known shapes, once the home is shortened.
function withoutAccount(text) {
  return ACCOUNT_RULES.reduce(applyRule, text);
}

// The part of a match its replacement changes, so a hit covers the value and not the name before it.
function changedSpan(match, replaced) {
  const shorter = Math.min(match.length, replaced.length);
  let start = 0;
  while (start < shorter && match[start] === replaced[start]) start++;
  let end = 0;
  while (end < shorter - start && match.at(-1 - end) === replaced.at(-1 - end)) end++;
  return { start, length: match.length - start - end };
}

// Where redact would change a draft, as { kind, index, length } in text order and never the text. A hit inside a longer
// one is dropped, such as the account name inside a home path. Text already redacted is no hit. A change no rule can
// place is still reported, and a machine with no home to compare with throws, so a draft is never passed unchecked.
function draftHits(text) {
  if (!HOME_PATH) throw Object.assign(new Error("no home directory"), { code: "no home directory to check against" });
  const rules = [
    ...SECRET_RULES.map((rule) => ["secret", ...rule]),
    ["home", HOME_PATH, () => "~"],
    ...ACCOUNT_RULES.map((rule) => ["account", ...rule]),
  ];
  const found = [];
  for (const [kind, pattern, replace] of rules) {
    for (const match of text.matchAll(pattern)) {
      const { start, length } = changedSpan(match[0], replace(...match));
      if (length > 0) found.push({ kind, index: match.index + start, length });
    }
  }
  for (const match of text.matchAll(HIDDEN_CHARACTERS)) {
    found.push({ kind: "hidden-character", index: match.index, length: match[0].length });
  }
  found.sort((a, b) => a.index - b.index || b.length - a.length);
  let reach = 0;
  const hits = found.filter(({ index, length }) => {
    if (index + length <= reach) return false;
    reach = index + length;
    return true;
  });
  const redacted = redact(text);
  if (hits.length || redacted === text) return hits;
  let index = 0;
  while (text[index] === redacted[index]) index++;
  return [{ kind: "unlocated", index, length: 1 }];
}

function cut(text, size) {
  return text.length <= size ? text : `${text.slice(0, size)} [excerpt truncated]`;
}

function excerpt(value, size = 480) {
  return cut(redact(value), size);
}

// The start of a Node import error's line, as Node prints it or as the error field of its test runner's TAP report, or
// -1: the first line with "Cannot find " before " imported from ". It ends with the importing file; the module form
// usually names the workspace path twice, while the package form names a package and the workspace path once. A lone
// \r starts a line as \n does, so progress text a program rewrote before the error is not part of it. Only lines
// holding " imported from " are tested, each once, so the scan stays linear in the output.
function importErrorStart(output) {
  for (let at = output.indexOf(" imported from "); at !== -1;) {
    const start = output.lastIndexOf("\n", at) + 1;
    const end = output.indexOf("\n", at);
    let head = start;
    for (const line of output.slice(start, end === -1 ? output.length : end).split("\r")) {
      const found = /\bCannot find /.exec(line);
      if (found && found.index + "Cannot find ".length <= line.lastIndexOf(" imported from ")) return head;
      head += line.length + 1;
    }
    if (end === -1) return -1;
    at = output.indexOf(" imported from ", end);
  }
  return -1;
}

// The excerpt of a failed call's output, from a little before the diagnostic named in it or else from its start. With
// no diagnostic named, a Node import error's excerpt starts at the error's line, and a line too long for the excerpt
// loses its middle instead of its end, so the excerpt ends with "imported from" and the importing file and holds
// "imported from" once. An importing path longer than the excerpt less 120 characters keeps its end; the closing quote
// of the TAP form is not counted.
function failureExcerpt(output, named, size = 480) {
  const imported = named ? -1 : importErrorStart(output);
  if (imported === -1) return excerpt(output.slice(named ? Math.max(0, named.index - 100) : 0), size);
  const text = redact(output.slice(imported));
  const line = text.split(/\r?\n|\r/, 1)[0];
  if (line.length <= size) return cut(text, size);
  const quote = line.endsWith('"') ? '"' : "";
  const from = line.lastIndexOf(" imported from ");
  const file = line.slice(from + " imported from ".length, line.length - quote.length);
  const room = size - 120;
  const tail = ` imported from ${file.length > room ? `[excerpt truncated] ${file.slice(-room)}` : file}${quote}`;
  const kept = Math.min(size - tail.length, from);
  return `${line.slice(0, kept)}${kept < from ? " [excerpt truncated]" : ""}${tail}`;
}

// A field that names the session, its model or agent is copied as written, cut to the same bound.
function bounded(value, size = 120) {
  return value ? cut(String(value), size) : null;
}

// The session's working directory with its home prefix shortened to ~, as in a path, and nothing else changed:
// session-review expands the ~ again to compare it with the repository root.
function directory(value) {
  return value ? cut(withoutHome(String(value)), 480) : null;
}

// A record's timestamp is copied as an excerpt, so a malformed record cannot inflate the evidence.
function timeOf(row) {
  return row.timestamp ? excerpt(row.timestamp, 120) : null;
}

module.exports = { HOME, bounded, cut, directory, draftHits, excerpt, failureExcerpt, redact, timeOf };

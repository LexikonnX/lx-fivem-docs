"use strict";

// src/utils/fs.ts
var import_fs = require("fs");
var import_path = require("path");
async function readText(p) {
  return await import_fs.promises.readFile(p, "utf8");
}
async function writeText(p, s) {
  await import_fs.promises.mkdir((0, import_path.dirname)(p), { recursive: true }).catch(() => {
  });
  await import_fs.promises.writeFile(p, s, "utf8");
}
async function exists(p) {
  try {
    await import_fs.promises.stat(p);
    return true;
  } catch {
    return false;
  }
}
async function walk(dir) {
  const out = [];
  async function rec(d) {
    const items = await import_fs.promises.readdir(d, { withFileTypes: true });
    for (const it of items) {
      const p = d + "/" + it.name;
      if (it.isDirectory()) await rec(p);
      else out.push(p);
    }
  }
  await rec(dir);
  return out;
}

// src/parsers/lua.ts
var callRe = /\b([A-Za-z_][A-Za-z0-9_\.]*)\s*\(([^)]*)\)/g;
var assignVarRe = /\blocal\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*["']([^"']+)["']/g;
var assignTableRe = /\blocal\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\{([\s\S]*?)\}/g;
var tableFieldRe = /\b([A-Za-z_][A-Za-z0-9_]*)\s*=\s*["']([^"']+)["']|^\s*\[\s*["']([^"']+)["']\s*\]\s*=\s*["']([^"']+)["']/gm;
var evFns = /* @__PURE__ */ new Set(["RegisterNetEvent", "AddEventHandler", "TriggerServerEvent", "TriggerClientEvent", "TriggerEvent"]);
function buildEnv(src) {
  const vars = /* @__PURE__ */ new Map();
  const fields = /* @__PURE__ */ new Map();
  let m;
  while (m = assignVarRe.exec(src)) vars.set(m[1], m[2]);
  while (m = assignTableRe.exec(src)) {
    const t = m[1];
    const body = m[2];
    let f;
    tableFieldRe.lastIndex = 0;
    while (f = tableFieldRe.exec(body)) {
      if (f[1] && f[2]) fields.set(`${t}.${f[1]}`, f[2]);
      else if (f[3] && f[4]) fields.set(`${t}.${f[3]}`, f[4]);
    }
  }
  return { vars, fields };
}
function resolveFirstArg(argRaw, env) {
  const s = argRaw.trim();
  if (s.startsWith('"') || s.startsWith("'")) {
    const m = /["']([^"']+)["']/.exec(s);
    return m ? m[1] : "";
  }
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(s)) {
    const v = env.vars.get(s);
    if (v) return v;
  }
  const dot = s.replace(/\s+/g, "");
  if (/^[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*$/.test(dot)) {
    const v = env.fields.get(dot);
    if (v) return v;
  }
  const idx = dot.match(/^([A-Za-z_][A-Za-z0-9_]*)\[\s*["']([^"']+)["']\s*\]$/);
  if (idx) {
    const v = env.fields.get(`${idx[1]}.${idx[2]}`);
    if (v) return v;
  }
  const cat = dot.match(/^([A-Za-z_][A-Za-z0-9_]*)\.\.["']([^"']+)["']$/);
  if (cat) {
    const v = env.vars.get(cat[1]) || "";
    if (v) return v + cat[2];
  }
  return "";
}
function parseLua(path, src) {
  const env = buildEnv(src);
  const events = {};
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    callRe.lastIndex = 0;
    let m;
    while (m = callRe.exec(lines[i])) {
      const fn = m[1];
      const args = m[2];
      if (!evFns.has(fn)) continue;
      const firstArg = args.split(",")[0] || "";
      const name = resolveFirstArg(firstArg, env);
      const key = name || "";
      const where = `${path}:${i + 1}`;
      if (!events[key]) events[key] = { name: key, calls: [], handlers: [] };
      if (fn === "RegisterNetEvent" || fn === "AddEventHandler") events[key].handlers.push(where);
      else events[key].calls.push(where);
    }
  }
  return { path, language: "lua", events: Object.values(events), commands: [], nui: [] };
}

// src/parsers/js.ts
function parseJs(path, src) {
  const commands = [];
  const nui = [];
  const lines = src.split(/\r?\n/);
  const cmdRe = /\bRegisterCommand\s*\(\s*["'`]([^"'`]+)["'`]/g;
  const nuiRe = /\bRegisterNUICallback\s*\(\s*["'`]([^"'`]+)["'`]/g;
  for (let i = 0; i < lines.length; i++) {
    let m;
    cmdRe.lastIndex = 0;
    while (m = cmdRe.exec(lines[i])) {
      const name = m[1];
      const where = `${path}:${i + 1}`;
      const e = commands.find((c) => c.name === name);
      if (e) e.where.push(where);
      else commands.push({ name, where: [where] });
    }
    nuiRe.lastIndex = 0;
    while (m = nuiRe.exec(lines[i])) {
      const name = m[1];
      const where = `${path}:${i + 1}`;
      const e = nui.find((n) => n.name === name);
      if (e) e.where.push(where);
      else nui.push({ name, where: [where] });
    }
  }
  return { path, language: "javascript", events: [], commands, nui };
}

// src/parsers/fxmanifest.ts
function parseFx(path, src) {
  return { path, language: "fxmanifest", events: [], commands: [], nui: [] };
}

// src/scan.ts
var import_path2 = require("path");
function ext(p) {
  const m = p.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : "";
}
async function scanProject(root) {
  const files = await walk(root);
  const out = [];
  for (const abs of files) {
    const rel = (0, import_path2.relative)(root, abs) || abs;
    const e = ext(abs);
    const src = await readText(abs).catch(() => "");
    if (!src) continue;
    if (abs.endsWith("fxmanifest.lua")) out.push(parseFx(rel, src));
    else if (e === "lua") out.push(parseLua(rel, src));
    else if (e === "js" || e === "ts") out.push(parseJs(rel, src));
  }
  const events = {};
  const commands = {};
  const nui = {};
  for (const f of out) {
    for (const ev of f.events || []) {
      const k = ev.name || "";
      if (!events[k]) events[k] = { name: k, calls: [], handlers: [] };
      events[k].calls.push(...ev.calls || []);
      events[k].handlers.push(...ev.handlers || []);
    }
    for (const c of f.commands || []) {
      if (!commands[c.name]) commands[c.name] = { name: c.name, where: [] };
      commands[c.name].where.push(...c.where || []);
    }
    for (const n of f.nui || []) {
      if (!nui[n.name]) nui[n.name] = { name: n.name, where: [] };
      nui[n.name].where.push(...n.where || []);
    }
  }
  return { files: out, events: Object.values(events), commands: Object.values(commands), nui: Object.values(nui) };
}

// src/generate/md.ts
function table(h, rows) {
  const a = `| ${h.join(" | ")} |`;
  const b = `|${h.map(() => "---").join("|")}|`;
  const r = rows.map((x) => `| ${x.join(" | ")} |`).join("\n");
  return [a, b, r].join("\n");
}
function list(s) {
  return s.join(", ");
}
function renderMarkdown(p) {
  const parts = [];
  parts.push("# Project map");
  const byFile = p.files.slice().sort((a, b) => a.path.localeCompare(b.path));
  for (const f of byFile) {
    const name = f.path.split("/").pop() || f.path;
    parts.push(`
## ${name}`);
    if (f.events.length) {
      parts.push(`
### Net events
`);
      const rows = f.events.map((e) => [e.name || "(unknown)", e.calls.length ? list(e.calls) : "", e.handlers.length ? list(e.handlers) : ""]);
      parts.push(table(["Name", "Calls", "Handlers"], rows));
    }
    if (f.commands.length) {
      parts.push(`
### Commands
`);
      const rows = f.commands.map((c) => [c.name, list(c.where)]);
      parts.push(table(["Name", "Where"], rows));
    }
    if (f.nui.length) {
      parts.push(`
### NUI callbacks
`);
      const rows = f.nui.map((n) => [n.name, list(n.where)]);
      parts.push(table(["Name", "Where"], rows));
    }
  }
  parts.push(`
## Summary`);
  if (p.events.length) {
    parts.push(`
### All events
`);
    const rows = p.events.map((e) => [e.name || "(unknown)", String(e.calls.length), String(e.handlers.length)]);
    parts.push(table(["Name", "Calls", "Handlers"], rows));
  }
  if (p.commands.length) {
    parts.push(`
### All commands
`);
    const rows = p.commands.map((c) => [c.name, String(c.where.length)]);
    parts.push(table(["Name", "Count"], rows));
  }
  if (p.nui.length) {
    parts.push(`
### All NUI callbacks
`);
    const rows = p.nui.map((n) => [n.name, String(n.where.length)]);
    parts.push(table(["Name", "Count"], rows));
  }
  return parts.join("\n");
}

// src/generate/json.ts
function renderJson(p) {
  return JSON.stringify(p, null, 2);
}

// src/index.ts
var import_path3 = require("path");
function parseArgs(argv) {
  const args = argv.slice(2);
  const cmd = args[0] || "";
  const rest = args.slice(1);
  const opts = {};
  const pos = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--out") opts.out = rest[++i];
    else if (a === "--format") opts.format = rest[++i];
    else pos.push(a);
  }
  return { cmd, pos, opts };
}
async function main() {
  const { cmd, pos, opts } = parseArgs(process.argv);
  if (cmd !== "scan") {
    console.error("Usage: index scan <path> --out <dir> --format md,json|md|json");
    process.exit(1);
  }
  const root = pos[0];
  if (!root || !await exists(root)) {
    console.error("Path not found");
    process.exit(1);
  }
  const outDir = String(opts.out || "./docs");
  const format = String(opts.format || "md,json");
  const proj = await scanProject(root);
  if (format.includes("md")) {
    const md = renderMarkdown(proj);
    await writeText((0, import_path3.join)(outDir, "API.md"), md);
  }
  if (format.includes("json")) {
    const js = renderJson(proj);
    await writeText((0, import_path3.join)(outDir, "trace.json"), js);
  }
  console.log("Done");
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
//# sourceMappingURL=index.cjs.map
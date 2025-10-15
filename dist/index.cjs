"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_commander = require("commander");

// src/utils/fs.ts
var import_glob = require("glob");
var import_promises = require("fs/promises");
var import_path = require("path");
async function listFiles(root, patterns) {
  const files = await (0, import_glob.glob)(patterns, { cwd: root, dot: true, posix: true, absolute: false });
  return files.map((f) => f.split(import_path.sep).join("/"));
}
async function read(root, rel) {
  const p = (0, import_path.join)(root, rel);
  return await (0, import_promises.readFile)(p, "utf8");
}

// src/parsers/lua.ts
var import_luaparse = __toESM(require("luaparse"), 1);
function parseLua(content, file, side) {
  const events = {};
  const commands = [];
  const exportsArr = [];
  const convars = [];
  const ast = import_luaparse.default.parse(content, { locations: true, ranges: true, comments: false, luaVersion: "5.1" });
  function callName(node) {
    if (node.type !== "CallExpression") return "";
    if (node.base.type === "Identifier") return node.base.name;
    if (node.base.type === "MemberExpression" && node.base.identifier?.name) return node.base.identifier.name;
    return "";
  }
  function argString(node, idx) {
    const a = node.arguments?.[idx];
    if (!a) return void 0;
    if (a.type === "StringLiteral") return a.value;
    return void 0;
  }
  function lineOf(node) {
    return node.loc?.start?.line || 1;
  }
  function addCallEvent(name, from, to, node) {
    if (!events[name]) events[name] = { name, from, to, callsites: [], handlers: [] };
    events[name].callsites.push({ file, line: lineOf(node) });
  }
  function addHandleEvent(name, to, node) {
    if (!events[name]) events[name] = { name, from: to, to, callsites: [], handlers: [] };
    events[name].handlers.push({ file, line: lineOf(node) });
  }
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "CallExpression") {
      const n = callName(node);
      if (n === "TriggerEvent") addCallEvent(argString(node, 0) || "", side, side, node);
      if (n === "TriggerServerEvent") addCallEvent(argString(node, 0) || "", side, "server", node);
      if (n === "TriggerClientEvent") addCallEvent(argString(node, 0) || "", side, "client", node);
      if (n === "RegisterNetEvent") addHandleEvent(argString(node, 0) || "", side, node);
      if (n === "RegisterCommand") {
        const name = argString(node, 0) || "";
        commands.push({ name, side, file, line: lineOf(node) });
      }
      if (n === "exports") {
        const fn = argString(node, 0) || "";
        if (fn) exportsArr.push({ name: fn, side, declared: { file, line: lineOf(node) }, usage: [] });
      }
      if (n === "SetConvar") {
        const key = argString(node, 0) || "";
        const val = argString(node, 1);
        convars.push({ key, file, line: lineOf(node), defaultValue: val });
      }
      if (n === "GetConvar") {
        const key = argString(node, 0) || "";
        convars.push({ key, file, line: lineOf(node) });
      }
    }
    for (const k in node) {
      const v = node[k];
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") walk(v);
    }
  }
  walk(ast);
  return { events: Object.values(events), commands, exports: exportsArr, convars };
}

// src/parsers/js.ts
var import_typescript_estree = require("@typescript-eslint/typescript-estree");
function parseNui(content, file) {
  const ast = (0, import_typescript_estree.parse)(content, { jsx: true, loc: true });
  const out = [];
  function isSendNui(node) {
    if (node.type !== "CallExpression") return false;
    const callee = node.callee;
    if (callee.type === "Identifier" && callee.name === "SendNUIMessage") return true;
    return false;
  }
  function isRegisterCallback(node) {
    if (node.type !== "CallExpression") return false;
    const callee = node.callee;
    if (callee.type === "Identifier" && callee.name === "RegisterNUICallback") return true;
    return false;
  }
  function argString(node, idx) {
    const a = node.arguments?.[idx];
    if (!a) return void 0;
    if (a.type === "Literal") return a.value;
    if (a.type === "TemplateLiteral" && a.quasis[0]) return a.quasis[0].value.cooked;
    return void 0;
  }
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "CallExpression") {
      if (isSendNui(node)) {
        out.push({ channel: "SendNUIMessage", direction: "lua_to_js", file, line: node.loc.start.line });
      }
      if (isRegisterCallback(node)) {
        const ch = argString(node, 0) || "";
        out.push({ channel: ch, direction: "js_to_lua", file, line: node.loc.start.line });
      }
    }
    for (const k in node) {
      const v = node[k];
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") walk(v);
    }
  }
  walk(ast);
  return out;
}

// src/scan.ts
function detectSide(file) {
  const f = file.toLowerCase();
  if (f.includes("/client") || f.endsWith("/client.lua") || f.endsWith("_client.lua")) return "client";
  if (f.includes("/server") || f.endsWith("/server.lua") || f.endsWith("_server.lua")) return "server";
  if (f.includes("/html/") || f.endsWith(".js") || f.endsWith(".ts")) return "nui";
  return "shared";
}
async function scanProject(root) {
  const patterns = ["**/*.lua", "**/*.js", "**/*.ts", "!**/node_modules/**"];
  const files = await listFiles(root, patterns);
  const resourcesMap = /* @__PURE__ */ new Map();
  for (const file of files) {
    const parts = file.split("/");
    let resName = parts[0];
    if (!resName || resName === "resources") resName = parts[1] || "root";
    if (!resourcesMap.has(resName)) resourcesMap.set(resName, { name: resName, files: [], events: [], commands: [], exports: [], convars: [], nui: [], deps: [] });
    const res = resourcesMap.get(resName);
    res.files.push(file);
    const side = detectSide(file);
    const content = await read(root, file);
    if (file.endsWith(".lua")) {
      const r = parseLua(content, file, side === "nui" ? "client" : side);
      res.events.push(...r.events);
      res.commands.push(...r.commands);
      res.exports.push(...r.exports);
      res.convars.push(...r.convars);
    } else if (file.endsWith(".js") || file.endsWith(".ts")) {
      const n = parseNui(content, file);
      res.nui.push(...n);
    }
  }
  return { resources: Array.from(resourcesMap.values()), scannedAt: (/* @__PURE__ */ new Date()).toISOString(), version: "0.1.0" };
}

// src/generate/json.ts
var import_promises2 = require("fs/promises");
async function writeTraceJSON(outDir, data) {
  await (0, import_promises2.writeFile)(outDir + "/trace.json", JSON.stringify(data, null, 2), "utf8");
}

// src/generate/md.ts
var import_promises3 = require("fs/promises");
async function writeApiMD(outDir, data) {
  let md = "# Project map\n\n";
  for (const r of data.resources) {
    md += `## ${r.name}

`;
    if (r.commands.length) {
      md += "### Commands\n\n| Command | Side | File | Line |\n|--------:|-----|------|------|\n";
      for (const c of r.commands) md += `| ${c.name} | ${c.side} | ${c.file} | ${c.line} |
`;
      md += "\n";
    }
    if (r.events.length) {
      md += "### Net events\n\n| Name | From | To | Calls | Handlers |\n|------|------|----|-------|----------|\n";
      for (const e of r.events) {
        const calls = e.callsites.map((x) => `${x.file}:${x.line}`).join(", ");
        const handlers = e.handlers.map((x) => `${x.file}:${x.line}`).join(", ");
        md += `| ${e.name} | ${e.from} | ${e.to} | ${calls} | ${handlers} |
`;
      }
      md += "\n";
    }
    if (r.exports.length) {
      md += "### Exports\n\n| Name | Side | Declared |\n|------|------|----------|\n";
      for (const x of r.exports) md += `| ${x.name} | ${x.side} | ${x.declared.file}:${x.declared.line} |
`;
      md += "\n";
    }
    if (r.nui.length) {
      md += "### NUI\n\n| Channel | Direction | File | Line |\n|---------|-----------|------|------|\n";
      for (const n of r.nui) md += `| ${n.channel} | ${n.direction} | ${n.file} | ${n.line} |
`;
      md += "\n";
    }
  }
  await (0, import_promises3.writeFile)(outDir + "/API.md", md, "utf8");
}

// src/index.ts
var import_promises4 = require("fs/promises");
var import_chalk = __toESM(require("chalk"), 1);
var import_path2 = require("path");
var program = new import_commander.Command();
program.name("fx-trace").version("0.1.0");
program.command("scan").argument("<root>").option("--out <dir>", "output dir", "./docs").option("--format <list>", "json,md", "json,md").action(async (root, opts) => {
  const out = (0, import_path2.resolve)(process.cwd(), opts.out);
  await (0, import_promises4.mkdir)(out, { recursive: true });
  const data = await scanProject(root);
  const formats = String(opts.format).split(",").map((x) => x.trim());
  if (formats.includes("json")) await writeTraceJSON(out, data);
  if (formats.includes("md")) await writeApiMD(out, data);
  console.log(import_chalk.default.green("Scan complete"), import_chalk.default.gray(out));
});
program.parse();
//# sourceMappingURL=index.cjs.map
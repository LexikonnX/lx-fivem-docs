import { walk, readText } from "./utils/fs"
import { FileScanResult, ProjectScan } from "./utils/types"
import { parseLua } from "./parsers/lua"
import { parseJs } from "./parsers/js"
import { parseFx } from "./parsers/fxmanifest"
import { relative } from "path"

function ext(p: string) {
  const m = p.match(/\.([a-zA-Z0-9]+)$/)
  return m ? m[1].toLowerCase() : ""
}

export async function scanProject(root: string): Promise<ProjectScan> {
  const files = await walk(root)
  const out: FileScanResult[] = []
  for (const abs of files) {
    const rel = relative(root, abs) || abs
    const e = ext(abs)
    const src = await readText(abs).catch(() => "")
    if (!src) continue
    if (abs.endsWith("fxmanifest.lua")) out.push(parseFx(rel, src))
    else if (e === "lua") out.push(parseLua(rel, src))
    else if (e === "js" || e === "ts") out.push(parseJs(rel, src))
  }
  const events: Record<string, { name: string; calls: string[]; handlers: string[] }> = {}
  const commands: Record<string, { name: string; where: string[] }> = {}
  const nui: Record<string, { name: string; where: string[] }> = {}
  for (const f of out) {
    for (const ev of f.events || []) {
      const k = ev.name || ""
      if (!events[k]) events[k] = { name: k, calls: [], handlers: [] }
      events[k].calls.push(...(ev.calls || []))
      events[k].handlers.push(...(ev.handlers || []))
    }
    for (const c of f.commands || []) {
      if (!commands[c.name]) commands[c.name] = { name: c.name, where: [] }
      commands[c.name].where.push(...(c.where || []))
    }
    for (const n of f.nui || []) {
      if (!nui[n.name]) nui[n.name] = { name: n.name, where: [] }
      nui[n.name].where.push(...(n.where || []))
    }
  }
  return { files: out, events: Object.values(events), commands: Object.values(commands), nui: Object.values(nui) }
}

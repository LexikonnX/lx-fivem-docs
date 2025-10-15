import { FileScanResult, EventRef } from "../utils/types.ts"

const callRe = /\b([A-Za-z_][A-Za-z0-9_\.]*)\s*\(([^)]*)\)/g
const assignVarRe = /\blocal\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*["']([^"']+)["']/g
const assignTableRe = /\blocal\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\{([\s\S]*?)\}/g
const tableFieldRe = /\b([A-Za-z_][A-Za-z0-9_]*)\s*=\s*["']([^"']+)["']|^\s*\[\s*["']([^"']+)["']\s*\]\s*=\s*["']([^"']+)["']/gm
const evFns = new Set(["RegisterNetEvent","AddEventHandler","TriggerServerEvent","TriggerClientEvent","TriggerEvent"])

function buildEnv(src: string) {
  const vars = new Map<string,string>()
  const fields = new Map<string,string>()
  let m
  while ((m = assignVarRe.exec(src))) vars.set(m[1], m[2])
  while ((m = assignTableRe.exec(src))) {
    const t = m[1]
    const body = m[2]
    let f
    tableFieldRe.lastIndex = 0
    while ((f = tableFieldRe.exec(body))) {
      if (f[1] && f[2]) fields.set(`${t}.${f[1]}`, f[2])
      else if (f[3] && f[4]) fields.set(`${t}.${f[3]}`, f[4])
    }
  }
  return { vars, fields }
}

function resolveFirstArg(argRaw: string, env: { vars: Map<string,string>, fields: Map<string,string> }) {
  const s = argRaw.trim()
  if (s.startsWith('"') || s.startsWith("'")) {
    const m = /["']([^"']+)["']/.exec(s)
    return m ? m[1] : ""
  }
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(s)) {
    const v = env.vars.get(s)
    if (v) return v
  }
  const dot = s.replace(/\s+/g, "")
  if (/^[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*$/.test(dot)) {
    const v = env.fields.get(dot)
    if (v) return v
  }
  const idx = dot.match(/^([A-Za-z_][A-Za-z0-9_]*)\[\s*["']([^"']+)["']\s*\]$/)
  if (idx) {
    const v = env.fields.get(`${idx[1]}.${idx[2]}`)
    if (v) return v
  }
  const cat = dot.match(/^([A-Za-z_][A-Za-z0-9_]*)\.\.["']([^"']+)["']$/)
  if (cat) {
    const v = env.vars.get(cat[1]) || ""
    if (v) return v + cat[2]
  }
  return ""
}

export function parseLua(path: string, src: string): FileScanResult {
  const env = buildEnv(src)
  const events: Record<string, EventRef> = {}
  const lines = src.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    callRe.lastIndex = 0
    let m
    while ((m = callRe.exec(lines[i]))) {
      const fn = m[1]
      const args = m[2]
      if (!evFns.has(fn)) continue
      const firstArg = args.split(",")[0] || ""
      const name = resolveFirstArg(firstArg, env)
      const key = name || ""
      const where = `${path}:${i+1}`
      if (!events[key]) events[key] = { name: key, calls: [], handlers: [] }
      if (fn === "RegisterNetEvent" || fn === "AddEventHandler") events[key].handlers.push(where)
      else events[key].calls.push(where)
    }
  }
  return { path, language: "lua", events: Object.values(events), commands: [], nui: [] }
}

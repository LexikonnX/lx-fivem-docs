import { ProjectScan } from "../utils/types"

function table(h: string[], rows: string[][]) {
  const a = `| ${h.join(" | ")} |`
  const b = `|${h.map(()=> "---").join("|")}|`
  const r = rows.map(x=>`| ${x.join(" | ")} |`).join("\n")
  return [a,b,r].join("\n")
}

function list(s: string[]) {
  return s.join(", ")
}

export function renderMarkdown(p: ProjectScan) {
  const parts: string[] = []
  parts.push("# Project map")
  const byFile = p.files.slice().sort((a,b)=>a.path.localeCompare(b.path))
  for (const f of byFile) {
    const name = f.path.split("/").pop() || f.path
    parts.push(`\n## ${name}`)
    if (f.events.length) {
      parts.push(`\n### Net events\n`)
      const rows = f.events.map(e=>[e.name || "(unknown)", e.calls.length?list(e.calls):"", e.handlers.length?list(e.handlers):""])
      parts.push(table(["Name","Calls","Handlers"], rows))
    }
    if (f.commands.length) {
      parts.push(`\n### Commands\n`)
      const rows = f.commands.map(c=>[c.name, list(c.where)])
      parts.push(table(["Name","Where"], rows))
    }
    if (f.nui.length) {
      parts.push(`\n### NUI callbacks\n`)
      const rows = f.nui.map(n=>[n.name, list(n.where)])
      parts.push(table(["Name","Where"], rows))
    }
  }
  parts.push(`\n## Summary`)
  if (p.events.length) {
    parts.push(`\n### All events\n`)
    const rows = p.events.map(e=>[e.name || "(unknown)", String(e.calls.length), String(e.handlers.length)])
    parts.push(table(["Name","Calls","Handlers"], rows))
  }
  if (p.commands.length) {
    parts.push(`\n### All commands\n`)
    const rows = p.commands.map(c=>[c.name, String(c.where.length)])
    parts.push(table(["Name","Count"], rows))
  }
  if (p.nui.length) {
    parts.push(`\n### All NUI callbacks\n`)
    const rows = p.nui.map(n=>[n.name, String(n.where.length)])
    parts.push(table(["Name","Count"], rows))
  }
  return parts.join("\n")
}

import { writeFile } from "node:fs/promises"
import { TraceProject } from "../types.js"

export async function writeApiMD(outDir: string, data: TraceProject) {
  let md = "# Project map\n\n"
  for (const r of data.resources) {
    md += `## ${r.name}\n\n`
    if (r.commands.length) {
      md += "### Commands\n\n| Command | Side | File | Line |\n|--------:|-----|------|------|\n"
      for (const c of r.commands) md += `| ${c.name} | ${c.side} | ${c.file} | ${c.line} |\n`
      md += "\n"
    }
    if (r.events.length) {
      md += "### Net events\n\n| Name | From | To | Calls | Handlers |\n|------|------|----|-------|----------|\n"
      for (const e of r.events) {
        const calls = e.callsites.map(x => `${x.file}:${x.line}`).join(", ")
        const handlers = e.handlers.map(x => `${x.file}:${x.line}`).join(", ")
        md += `| ${e.name} | ${e.from} | ${e.to} | ${calls} | ${handlers} |\n`
      }
      md += "\n"
    }
    if (r.exports.length) {
      md += "### Exports\n\n| Name | Side | Declared |\n|------|------|----------|\n"
      for (const x of r.exports) md += `| ${x.name} | ${x.side} | ${x.declared.file}:${x.declared.line} |\n`
      md += "\n"
    }
    if (r.nui.length) {
      md += "### NUI\n\n| Channel | Direction | File | Line |\n|---------|-----------|------|------|\n"
      for (const n of r.nui) md += `| ${n.channel} | ${n.direction} | ${n.file} | ${n.line} |\n`
      md += "\n"
    }
  }
  await writeFile(outDir + "/API.md", md, "utf8")
}

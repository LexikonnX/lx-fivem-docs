import { scanProject } from "./scan"
import { writeText, exists } from "./utils/fs"
import { renderMarkdown } from "./generate/md"
import { renderJson } from "./generate/json"
import { join } from "path"

function parseArgs(argv: string[]) {
  const args = argv.slice(2)
  const cmd = args[0] || ""
  const rest = args.slice(1)
  const opts: Record<string,string> = {}
  const pos: string[] = []
  for (let i=0;i<rest.length;i++) {
    const a = rest[i]
    if (a === "--out") opts.out = rest[++i]
    else if (a === "--format") opts.format = rest[++i]
    else pos.push(a)
  }
  return { cmd, pos, opts }
}

async function main() {
  const { cmd, pos, opts } = parseArgs(process.argv)
  if (cmd !== "scan") {
    console.error("Usage: index scan <path> --out <dir> --format md,json|md|json")
    process.exit(1)
  }
  const root = pos[0]
  if (!root || !(await exists(root))) {
    console.error("Path not found")
    process.exit(1)
  }
  const outDir = String(opts.out || "./docs")
  const format = String(opts.format || "md,json")
  const proj = await scanProject(root)
  if (format.includes("md")) {
    const md = renderMarkdown(proj)
    await writeText(join(outDir, "API.md"), md)
  }
  if (format.includes("json")) {
    const js = renderJson(proj)
    await writeText(join(outDir, "trace.json"), js)
  }
  console.log("Done")
}

main().catch(e=>{ console.error(e); process.exit(1) })

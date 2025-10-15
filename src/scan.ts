import { listFiles, read } from "./utils/fs.js"
import { parseLua } from "./parsers/lua.js"
import { parseNui } from "./parsers/js.js"
import { TraceProject, TraceResource } from "./types.js"
import { basename, dirname } from "node:path"

function detectSide(file: string): "client"|"server"|"shared"|"nui" {
  const f = file.toLowerCase()
  if (f.includes("/client") || f.endsWith("/client.lua") || f.endsWith("_client.lua")) return "client"
  if (f.includes("/server") || f.endsWith("/server.lua") || f.endsWith("_server.lua")) return "server"
  if (f.includes("/html/") || f.endsWith(".js") || f.endsWith(".ts")) return "nui"
  return "shared"
}
export async function scanProject(root: string): Promise<TraceProject> {
  const patterns = ["**/*.lua", "**/*.js", "**/*.ts", "!**/node_modules/**"]
  const files = await listFiles(root, patterns)
  const resourcesMap = new Map<string, TraceResource>()
  for (const file of files) {
    const parts = file.split("/")
    let resName = parts[0]
    if (!resName || resName === "resources") resName = parts[1] || "root"
    if (!resourcesMap.has(resName)) resourcesMap.set(resName, { name: resName, files: [], events: [], commands: [], exports: [], convars: [], nui: [], deps: [] })
    const res = resourcesMap.get(resName)!
    res.files.push(file)
    const side = detectSide(file)
    const content = await read(root, file)
    if (file.endsWith(".lua")) {
      const r = parseLua(content, file, side === "nui" ? "client" : side)
      res.events.push(...r.events)
      res.commands.push(...r.commands)
      res.exports.push(...r.exports)
      res.convars.push(...r.convars)
    } else if (file.endsWith(".js") || file.endsWith(".ts")) {
      const n = parseNui(content, file)
      res.nui.push(...n)
    }
  }
  return { resources: Array.from(resourcesMap.values()), scannedAt: new Date().toISOString(), version: "0.1.0" }
}

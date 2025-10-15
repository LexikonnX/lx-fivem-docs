import { writeFile } from "node:fs/promises"
import { TraceProject } from "../types.js"

export async function writeTraceJSON(outDir: string, data: TraceProject) {
  await writeFile(outDir + "/trace.json", JSON.stringify(data, null, 2), "utf8")
}

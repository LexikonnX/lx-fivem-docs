import { glob } from "glob"
import { readFile } from "fs/promises"
import { join, sep } from "path"
export async function listFiles(root: string, patterns: string[]) {
  const files = await glob(patterns, { cwd: root, dot: true, posix: true, absolute: false })
  return files.map(f => f.split(sep).join("/"))
}
export async function read(root: string, rel: string) {
  const p = join(root, rel)
  return await readFile(p, "utf8")
}

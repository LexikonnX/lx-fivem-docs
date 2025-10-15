import { promises as fsp } from "fs"
import { dirname } from "path"

export async function readText(p: string) {
  return await fsp.readFile(p, "utf8")
}

export async function writeText(p: string, s: string) {
  await fsp.mkdir(dirname(p), { recursive: true } as any).catch(() => {})
  await fsp.writeFile(p, s, "utf8")
}

export async function exists(p: string) {
  try { await fsp.stat(p); return true } catch { return false }
}

export async function walk(dir: string) {
  const out: string[] = []
  async function rec(d: string) {
    const items = await fsp.readdir(d, { withFileTypes: true } as any)
    for (const it of items) {
      const p = d + "/" + it.name
      if (it.isDirectory()) await rec(p)
      else out.push(p)
    }
  }
  await rec(dir)
  return out
}

import { FileScanResult, CommandRef, NuiRef } from "../utils/types.ts"

export function parseJs(path: string, src: string): FileScanResult {
  const commands: CommandRef[] = []
  const nui: NuiRef[] = []
  const lines = src.split(/\r?\n/)
  const cmdRe = /\bRegisterCommand\s*\(\s*["'`]([^"'`]+)["'`]/g
  const nuiRe = /\bRegisterNUICallback\s*\(\s*["'`]([^"'`]+)["'`]/g
  for (let i = 0; i < lines.length; i++) {
    let m
    cmdRe.lastIndex = 0
    while ((m = cmdRe.exec(lines[i]))) {
      const name = m[1]
      const where = `${path}:${i+1}`
      const e = commands.find(c => c.name === name)
      if (e) e.where.push(where)
      else commands.push({ name, where: [where] })
    }
    nuiRe.lastIndex = 0
    while ((m = nuiRe.exec(lines[i]))) {
      const name = m[1]
      const where = `${path}:${i+1}`
      const e = nui.find(n => n.name === name)
      if (e) e.where.push(where)
      else nui.push({ name, where: [where] })
    }
  }
  return { path, language: "javascript", events: [], commands, nui }
}

import { FileScanResult } from "../utils/types.ts"

export function parseFx(path: string, src: string): FileScanResult {
  return { path, language: "fxmanifest", events: [], commands: [], nui: [] }
}

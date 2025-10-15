import { ProjectScan } from "../utils/types.ts"

export function renderJson(p: ProjectScan) {
  return JSON.stringify(p, null, 2)
}

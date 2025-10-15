export type Lang = "lua" | "javascript" | "fxmanifest" | "other"
export type EventRef = { name: string; calls: string[]; handlers: string[] }
export type CommandRef = { name: string; where: string[] }
export type NuiRef = { name: string; where: string[] }
export type FileScanResult = { path: string; language: Lang; events: EventRef[]; commands: CommandRef[]; nui: NuiRef[] }
export type ProjectScan = { files: FileScanResult[]; events: EventRef[]; commands: CommandRef[]; nui: NuiRef[] }

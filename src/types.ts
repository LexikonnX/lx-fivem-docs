export type Side = "client" | "server" | "shared" | "nui"
export type TraceEvent = {
  name: string
  from: Side
  to: Side
  callsites: { file: string; line: number }[]
  handlers: { file: string; line: number }[]
  args?: { name?: string; type?: string }[]
}
export type TraceCommand = {
  name: string
  side: Side
  file: string
  line: number
}
export type TraceExport = {
  name: string
  side: Side
  declared: { file: string; line: number }
  usage: { resource?: string; file: string; line: number }[]
}
export type TraceConvar = {
  key: string
  file: string
  line: number
  defaultValue?: string
}
export type TraceNui = {
  channel: string
  direction: "lua_to_js" | "js_to_lua"
  file: string
  line: number
  schema?: Record<string, string>
}
export type TraceResource = {
  name: string
  files: string[]
  events: TraceEvent[]
  commands: TraceCommand[]
  exports: TraceExport[]
  convars: TraceConvar[]
  nui: TraceNui[]
  deps: string[]
}
export type TraceProject = {
  resources: TraceResource[]
  scannedAt: string
  version: string
}

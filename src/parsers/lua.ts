import luaparse from "luaparse"
import { TraceEvent, TraceCommand, TraceExport, TraceConvar } from "../types.js"

type LuaScan = {
  events: TraceEvent[]
  commands: TraceCommand[]
  exports: TraceExport[]
  convars: TraceConvar[]
}
export function parseLua(content: string, file: string, side: "client" | "server" | "shared"): LuaScan {
  const events: Record<string, TraceEvent> = {}
  const commands: TraceCommand[] = []
  const exportsArr: TraceExport[] = []
  const convars: TraceConvar[] = []
  const ast = luaparse.parse(content, { locations: true, ranges: true, comments: false, luaVersion: "5.1" })
  function callName(node: any) {
    if (node.type !== "CallExpression") return ""
    if (node.base.type === "Identifier") return node.base.name
    if (node.base.type === "MemberExpression" && node.base.identifier?.name) return node.base.identifier.name
    return ""
  }
  function argString(node: any, idx: number) {
    const a = node.arguments?.[idx]
    if (!a) return undefined
    if (a.type === "StringLiteral") return a.value
    return undefined
  }
  function lineOf(node: any) {
    return node.loc?.start?.line || 1
  }
  function addCallEvent(name: string, from: "client"|"server"|"shared", to: "client"|"server"|"shared", node: any) {
    if (!events[name]) events[name] = { name, from, to, callsites: [], handlers: [] }
    events[name].callsites.push({ file, line: lineOf(node) })
  }
  function addHandleEvent(name: string, to: "client"|"server"|"shared", node: any) {
    if (!events[name]) events[name] = { name, from: to, to, callsites: [], handlers: [] }
    events[name].handlers.push({ file, line: lineOf(node) })
  }
  function walk(node: any) {
    if (!node || typeof node !== "object") return
    if (node.type === "CallExpression") {
      const n = callName(node)
      if (n === "TriggerEvent") addCallEvent(argString(node, 0) || "", side, side, node)
      if (n === "TriggerServerEvent") addCallEvent(argString(node, 0) || "", side, "server", node)
      if (n === "TriggerClientEvent") addCallEvent(argString(node, 0) || "", side, "client", node)
      if (n === "RegisterNetEvent") addHandleEvent(argString(node, 0) || "", side, node)
      if (n === "RegisterCommand") {
        const name = argString(node, 0) || ""
        commands.push({ name, side, file, line: lineOf(node) })
      }
      if (n === "exports") {
        const fn = argString(node, 0) || ""
        if (fn) exportsArr.push({ name: fn, side, declared: { file, line: lineOf(node) }, usage: [] })
      }
      if (n === "SetConvar") {
        const key = argString(node, 0) || ""
        const val = argString(node, 1)
        convars.push({ key, file, line: lineOf(node), defaultValue: val })
      }
      if (n === "GetConvar") {
        const key = argString(node, 0) || ""
        convars.push({ key, file, line: lineOf(node) })
      }
    }
    for (const k in node) {
      const v = (node as any)[k]
      if (Array.isArray(v)) v.forEach(walk)
      else if (v && typeof v === "object") walk(v)
    }
  }
  walk(ast)
  return { events: Object.values(events), commands, exports: exportsArr, convars }
}

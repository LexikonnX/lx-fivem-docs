import { parse } from "@typescript-eslint/typescript-estree"
import { TraceNui } from "../types.js"

export function parseNui(content: string, file: string): TraceNui[] {
  const ast = parse(content, { jsx: true, loc: true })
  const out: TraceNui[] = []
  function isSendNui(node: any) {
    if (node.type !== "CallExpression") return false
    const callee = node.callee
    if (callee.type === "Identifier" && callee.name === "SendNUIMessage") return true
    return false
  }
  function isRegisterCallback(node: any) {
    if (node.type !== "CallExpression") return false
    const callee = node.callee
    if (callee.type === "Identifier" && callee.name === "RegisterNUICallback") return true
    return false
  }
  function argString(node: any, idx: number) {
    const a = node.arguments?.[idx]
    if (!a) return undefined
    if (a.type === "Literal") return a.value as string
    if (a.type === "TemplateLiteral" && a.quasis[0]) return a.quasis[0].value.cooked as string
    return undefined
  }
  function walk(node: any) {
    if (!node || typeof node !== "object") return
    if (node.type === "CallExpression") {
      if (isSendNui(node)) {
        out.push({ channel: "SendNUIMessage", direction: "lua_to_js", file, line: node.loc.start.line })
      }
      if (isRegisterCallback(node)) {
        const ch = argString(node, 0) || ""
        out.push({ channel: ch, direction: "js_to_lua", file, line: node.loc.start.line })
      }
    }
    for (const k in node) {
      const v = (node as any)[k]
      if (Array.isArray(v)) v.forEach(walk)
      else if (v && typeof v === "object") walk(v)
    }
  }
  walk(ast)
  return out
}

import { Command } from "commander"
import { scanProject } from "./scan.js"
import { writeTraceJSON } from "./generate/json.js"
import { writeApiMD } from "./generate/md.js"
import { mkdir } from "fs/promises"
import chalk from "chalk"
import { resolve } from "path"

const program = new Command()
program.name("fx-trace").version("0.1.0")

program
  .command("scan")
  .argument("<root>")
  .option("--out <dir>", "output dir", "./docs")
  .option("--format <list>", "json,md", "json,md")
  .action(async (root, opts) => {
    const out = resolve(process.cwd(), opts.out)
    await mkdir(out, { recursive: true })
    const data = await scanProject(root)
    const formats = String(opts.format).split(",").map((x: string) => x.trim())
    if (formats.includes("json")) await writeTraceJSON(out, data)
    if (formats.includes("md")) await writeApiMD(out, data)
    console.log(chalk.green("Scan complete"), chalk.gray(out))
  })

program.parse()

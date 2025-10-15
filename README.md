# lx-fivem-docs

**Automatic documentation generator for FiveM resources**

`lx-fivem-docs` is a lightweight CLI tool that scans your FiveM resource source code (`.lua`, `.js`, `.ts`) and automatically generates a clear documentation file (`API.md`) describing all network events, NUI callbacks, and commands used in your scripts.

---

## ✨ Features

- Scans entire resource folders recursively  
- Detects:
  - `RegisterNetEvent`, `AddEventHandler`, `TriggerServerEvent`, `TriggerClientEvent`, `TriggerEvent`
  - `RegisterCommand` and `RegisterNUICallback` in JavaScript/TypeScript
- Generates:
  - **`API.md`** — human-readable Markdown documentation  
  - **`trace.json`** — structured JSON data for further analysis
- Automatically resolves event names stored in variables or simple tables  
- Works completely offline — only requires Node.js

---

## ⚙️ Requirements

- Node.js **version 18 or newer**
- npm (comes bundled with Node.js)

---

## 🚀 Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/lx-fivem-docs.git
   cd lx-fivem-docs
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

This will compile all TypeScript files from the `src/` directory into the `dist/` folder.

---

## 🧮 Usage

Run the generator through Node:

```bash
node dist/index.js scan <path-to-resource> --out <output-directory> --format <format>
```

### Example

```bash
node dist/index.js scan ./resources/[local]/lx-admin --out ./docs --format md,json
```

This command:
- Scans all files inside `./resources/[local]/lx-admin`
- Generates:
  - `./docs/API.md`
  - `./docs/trace.json`

---

## 🗂️ Output Structure

### API.md
A Markdown summary of all detected events, commands, and NUI callbacks grouped by file.

Example:

```md
# Project map

## client.lua

### Net events

| Name | Calls | Handlers |
|------|--------|-----------|
| lx-admin:openMenu | client.lua:23 | client.lua:45, client.lua:67 |
| lx-admin:notify | client.lua:102 | - |

## server.lua

### Net events

| Name | Calls | Handlers |
|------|--------|-----------|
| lx-admin:saveData | server.lua:32 | server.lua:48 |
```

### trace.json
Machine-readable JSON structure containing all discovered data.

---

## 🧭 Command Options

| Option | Description | Example |
|---------|-------------|----------|
| `scan <path>` | Path to the resource folder | `scan ./resources/[local]/lx-admin` |
| `--out <dir>` | Output directory for generated docs | `--out ./docs` |
| `--format <type>` | Output format: `md`, `json`, or both (`md,json`) | `--format md,json` |

---

## 🧰 Typical Workflow

```bash
git clone https://github.com/<your-username>/lx-fivem-docs.git
cd lx-fivem-docs
npm install
npm run build
node dist/index.js scan ./resources/[local]/lx-police --out ./docs --format md,json
```

After running the command, open `./resources/[local]/lx-police/docs/API.md` to view the generated documentation.

---

## 🧩 Tips

- Run the script from the project root (where `package.json` is).  
- Works with any FiveM resource — client, server, or shared.  
- Generated paths are **relative** to the scanned resource folder.  
- You can run it multiple times for different resources — just change the `scan` path.

---

## 🧨 Troubleshooting

| Problem | Cause | Solution |
|----------|--------|-----------|
| `import: command not found` | File executed as shell script instead of Node | Always run using `node dist/index.js` |
| `Error: Cannot find module 'tsup'` | Dependencies missing | Run `npm install` |
| Absolute paths in documentation | Older version used | Rebuild using `npm run build` |
| No events found | No recognizable `RegisterNetEvent` or `Trigger...` calls | Check your source files |

---

## 🧠 How It Works

1. Recursively scans the provided folder.  
2. Parses `.lua`, `.js`, `.ts`, and `fxmanifest.lua` files.  
3. Detects all event and command registrations and calls.  
4. Builds an internal map of all detected data.  
5. Exports the result into Markdown (`API.md`) and/or JSON (`trace.json`).

---

## 🪪 License

MIT License © 2025 [Your Name or Organization]

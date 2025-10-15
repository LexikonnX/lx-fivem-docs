# lx-fivem-docs — Release Notes

### Version: latest (`last`)
**Release date:** 2025

---

## 🧩 Overview

`lx-fivem-docs` is an automatic documentation generator for FiveM resources.  
It scans your resource files (`.lua`, `.js`, `.ts`) and generates detailed Markdown and JSON documentation of all registered and triggered events, NUI callbacks, and commands.

---

## ✨ Features

- 🔍 Scans entire resource directories recursively  
- 📜 Detects:
  - `RegisterNetEvent`, `AddEventHandler`, `TriggerServerEvent`, `TriggerClientEvent`, `TriggerEvent`
  - `RegisterCommand` and `RegisterNUICallback` in JS/TS files  
- 🧾 Generates:
  - **API.md** — a structured Markdown document  
  - **trace.json** — machine-readable event mapping
- 🧠 Resolves events even if they’re stored in variables or tables
- 🧰 Works offline, no internet connection required

---

## ⚙️ Requirements

- Node.js **version 18 or higher**
- npm (comes pre-installed with Node)

---

## 🚀 How to Use

1. **Clone the repository**
   ```bash
   git clone https://github.com/LexikonnX/lx-fivem-docs.git
   cd lx-fivem-docs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run the generator**
   ```bash
   node dist/index.js scan <path-to-resource> --out <output-directory> --format md,json
   ```

Example:
```bash
node dist/index.js scan ./resources/[local]/lx-admin --out ./docs --format md,json
```

This will create:
- `./docs/API.md` — readable documentation
- `./docs/trace.json` — structured event mapping

---

## 🧭 Command Options

| Option | Description | Example |
|---------|-------------|----------|
| `scan <path>` | Path to the resource directory | `scan ./resources/[local]/lx-admin` |
| `--out <dir>` | Output directory for docs | `--out ./docs` |
| `--format <type>` | Format type (`md`, `json`, or both) | `--format md,json` |

---

## 🧠 Example Output (API.md)

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

---

## 🪪 License

MIT License © 2025 LexikonnX  
Project repository: [https://github.com/LexikonnX/lx-fivem-docs](https://github.com/LexikonnX/lx-fivem-docs)

---

### 💬 Notes

This release contains the stable version of the CLI tool capable of generating detailed FiveM resource documentation.  
For bug reports or feature requests, please open an issue on the repository.


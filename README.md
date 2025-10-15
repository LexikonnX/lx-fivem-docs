# lx-fivem-docs — Release: `last`

**Automatic documentation generator for FiveM resources**  
Author: **LexikonnX**  
Release page: [https://github.com/LexikonnX/lx-fivem-docs/releases/tag/v1.0.0](https://github.com/LexikonnX/lx-fivem-docs/releases/tag/v1.0.0)

---

## 📦 Download & Setup

1. **Download the latest release**  
   👉 [Click here to download ZIP](https://github.com/LexikonnX/lx-fivem-docs/releases/tag/v1.0.0)

2. **Extract the ZIP** anywhere on your computer (for example, in your Downloads folder).  
   You should see a folder named `lx-fivem-docs` containing files like `package.json`, `src/`, and `tsconfig.json`.

3. **Open Command Prompt or PowerShell in that folder**  
   Example (Windows):
   ```bash
   cd C:\Users\YourName\Downloads\lx-fivem-docs
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Build the project**
   ```bash
   npm run build
   ```

6. **Run the generator**
   ```bash
   node dist/index.js scan <path-to-resource> --out <output-directory> --format md,json
   ```

Example usage:
```bash
node dist/index.js scan .\resources\[local]\lx-admin --out .\docs --format md,json
```

This will generate:
- `.\docs\API.md` — Markdown documentation
- `.\docs\trace.json` — structured JSON data

---

## ✨ Features

- Recursively scans your resource folder  
- Detects:
  - `RegisterNetEvent`, `AddEventHandler`, `TriggerServerEvent`, `TriggerClientEvent`, `TriggerEvent`
  - `RegisterCommand` and `RegisterNUICallback` in JS/TS  
- Automatically resolves event names from variables or tables  
- Exports results to Markdown (`API.md`) and/or JSON (`trace.json`)

---

## 🧭 Command Options

| Option | Description | Example |
|---------|-------------|----------|
| `scan <path>` | Path to your resource folder | `scan .\resources\[local]\lx-admin` |
| `--out <dir>` | Output directory for generated files | `--out .\docs` |
| `--format <type>` | Output format: `md`, `json`, or both | `--format md,json` |

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

## ⚙️ Requirements

- Node.js **v18 or newer**
- npm (included with Node.js)

---

## 💬 Notes

This release (`last`) is a stable standalone version.  
It works on **Windows, macOS, and Linux**, but the examples above are written for **Windows users**.  
You do **not** need to clone the repository — just download the ZIP and run the commands locally.

For issues or feature requests, please use the repository page:  
👉 [https://github.com/LexikonnX/lx-fivem-docs](https://github.com/LexikonnX/lx-fivem-docs)

---

## 🪪 License

MIT License © 2025 **LexikonnX**

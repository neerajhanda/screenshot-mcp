# screenshot-mcp

An MCP server that captures full-monitor screenshots and returns them inline (base64) or as a saved file. Supports **macOS**, **native Linux** (X11 and Wayland), **native Windows**, and **WSL2**.

## Tools

### `list_monitors`
Lists all connected monitors with their index, resolution, and primary status. Call this first to find monitor indices.

### `take_screenshot`
Captures a screenshot of one monitor.

| Argument | Type | Default | Description |
|---|---|---|---|
| `monitor` | integer | `0` | Monitor index from `list_monitors` |
| `return` | `"inline"` \| `"path"` | `"inline"` | `inline` = base64 PNG in response (Claude sees it); `path` = save to disk, return the file path |
| `path` | string | temp file | Output path. Only used when `return="path"` |

> **Tip:** Very high-res monitors (4K, 5K) produce large base64 blobs. If you hit context limits, switch to `return="path"` and use the `Read` tool to view the file.

## Installation

```bash
git clone https://github.com/you/screenshot-mcp
cd screenshot-mcp
npm install
npm run build
```

## Platform requirements

| Platform | Requirement |
|---|---|
| **macOS** | Nothing extra — uses `screencapture` and `system_profiler` (built in) |
| **Native Linux / X11** | `scrot` or `imagemagick`: `sudo apt install scrot` |
| **Native Linux / Wayland** | `grim` + `wlr-randr`: `sudo apt install grim wlr-randr` |
| **Native Windows** | Nothing extra — uses PowerShell + `System.Drawing` |
| **WSL2** | Nothing extra — shells out to `powershell.exe` on the Windows side |

## Configure in Claude Code

```bash
claude mcp add screenshot node /absolute/path/to/screenshot-mcp/dist/index.js
```

## Configure in Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "screenshot": {
      "command": "node",
      "args": ["/absolute/path/to/screenshot-mcp/dist/index.js"]
    }
  }
}
```

## How WSL2 works

WSL2 doesn't have direct access to the Windows display. This server detects WSL (via `/proc/version` or `WSL_DISTRO_NAME`) and shells out to `powershell.exe` to run a capture script using `System.Windows.Forms.Screen` and `System.Drawing`. The PNG is written to the Linux `/tmp` filesystem via the `\\wsl.localhost\...` UNC path and then read back.

import { execFile } from "node:child_process";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import screenshot from "screenshot-desktop";
import type { Backend, Monitor } from "./types.js";

const execFileAsync = promisify(execFile);

function isWayland(): boolean {
  return process.env.XDG_SESSION_TYPE === "wayland" || !!process.env.WAYLAND_DISPLAY;
}

async function captureWayland(outputName: string, outPath: string): Promise<void> {
  await execFileAsync("grim", ["-o", outputName, outPath]);
}

async function listWaylandOutputs(): Promise<Monitor[]> {
  const { stdout } = await execFileAsync("wlr-randr", ["--json"]).catch(
    () => ({ stdout: "[]" })
  );
  const outputs = JSON.parse(stdout) as Array<{
    name: string;
    current_mode?: { width: number; height: number };
    position?: { x: number; y: number };
  }>;
  return outputs.map((o, i) => ({
    index: i,
    width: o.current_mode?.width ?? 0,
    height: o.current_mode?.height ?? 0,
    primary: i === 0,
    name: o.name,
  }));
}

export const linuxBackend: Backend = {
  async listMonitors(): Promise<Monitor[]> {
    if (isWayland()) {
      return listWaylandOutputs();
    }

    const displays = await screenshot.listDisplays();
    if (displays.length === 0) {
      throw new Error(
        "No displays found. On X11, ensure scrot or imagemagick is installed."
      );
    }
    return displays.map((d, i) => ({
      index: i,
      width: d.width ?? 0,
      height: d.height ?? 0,
      primary: d.primary ?? i === 0,
      name: d.name,
    }));
  },

  async capture(monitorIndex: number): Promise<Buffer> {
    const outPath = join(tmpdir(), `screenshot-mcp-${Date.now()}-${monitorIndex}.png`);

    if (isWayland()) {
      const monitors = await listWaylandOutputs();
      const monitor = monitors[monitorIndex];
      if (!monitor?.name) {
        throw new Error(`Monitor index ${monitorIndex} not found`);
      }
      await captureWayland(monitor.name, outPath);
      const data = await readFile(outPath);
      await unlink(outPath).catch(() => undefined);
      return data;
    }

    const displays = await screenshot.listDisplays();
    if (monitorIndex >= displays.length) {
      throw new Error(
        `Monitor index ${monitorIndex} out of range (0-${displays.length - 1})`
      );
    }

    const buf = await screenshot({ screen: displays[monitorIndex].id, format: "png" });
    return buf;
  },
};

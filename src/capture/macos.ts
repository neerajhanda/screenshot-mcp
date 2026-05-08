import { execFile } from "node:child_process";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { Backend, Monitor } from "./types.js";

const execFileAsync = promisify(execFile);

interface SPDisplay {
  _name?: string;
  spdisplays_ndrvs?: Array<{
    _name?: string;
    spdisplays_main?: string;
    spdisplays_resolution?: string;
  }>;
}

export const macosBackend: Backend = {
  async listMonitors(): Promise<Monitor[]> {
    const { stdout } = await execFileAsync("system_profiler", [
      "SPDisplaysDataType",
      "-json",
    ]);
    const data = JSON.parse(stdout) as { SPDisplaysDataType: SPDisplay[] };
    const monitors: Monitor[] = [];
    let index = 0;

    for (const gpu of data.SPDisplaysDataType) {
      for (const display of gpu.spdisplays_ndrvs ?? []) {
        const isPrimary = display.spdisplays_main === "spdisplays_yes";
        const res = display.spdisplays_resolution ?? "";
        const match = res.match(/(\d+)\s*x\s*(\d+)/);
        monitors.push({
          index,
          width: match ? parseInt(match[1], 10) : 0,
          height: match ? parseInt(match[2], 10) : 0,
          primary: isPrimary,
          name: display._name,
        });
        index++;
      }
    }

    return monitors;
  },

  async capture(monitorIndex: number): Promise<Buffer> {
    const outPath = join(
      tmpdir(),
      `screenshot-mcp-${Date.now()}-${monitorIndex}.png`
    );
    // -x = no sound, -D <n+1> = display number (1-based)
    await execFileAsync("screencapture", [
      "-x",
      "-D",
      String(monitorIndex + 1),
      outPath,
    ]);
    const data = await readFile(outPath);
    await unlink(outPath).catch(() => undefined);
    return data;
  },
};

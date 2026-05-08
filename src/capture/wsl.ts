import { execFile } from "node:child_process";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  buildCaptureScript,
  buildListMonitorsScript,
  runPowershell,
} from "./powershell-script.js";
import type { Backend, Monitor } from "./types.js";

const execFileAsync = promisify(execFile);

async function toWindowsPath(linuxPath: string): Promise<string> {
  const { stdout } = await execFileAsync("wslpath", ["-w", linuxPath]);
  return stdout.trim();
}

export const wslBackend: Backend = {
  async listMonitors(): Promise<Monitor[]> {
    const output = await runPowershell(buildListMonitorsScript());
    const raw = JSON.parse(output) as Array<{
      index: number;
      width: number;
      height: number;
      primary: boolean;
      name: string;
    }>;
    return raw.map((m, i) => ({
      index: i,
      width: m.width,
      height: m.height,
      primary: m.primary,
      name: m.name,
    }));
  },

  async capture(monitorIndex: number): Promise<Buffer> {
    const linuxTmp = join(
      tmpdir(),
      `screenshot-mcp-${Date.now()}-${monitorIndex}.png`
    );
    const winPath = await toWindowsPath(linuxTmp);

    await runPowershell(buildCaptureScript(monitorIndex, winPath));

    const data = await readFile(linuxTmp);
    await unlink(linuxTmp).catch(() => undefined);
    return data;
  },
};

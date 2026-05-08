import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFile, unlink } from "node:fs/promises";
import {
  buildCaptureScript,
  buildListMonitorsScript,
  runPowershell,
} from "./powershell-script.js";
import type { Backend, Monitor } from "./types.js";

export const windowsBackend: Backend = {
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
    const outPath = join(
      tmpdir(),
      `screenshot-mcp-${Date.now()}-${monitorIndex}.png`
    );
    await runPowershell(buildCaptureScript(monitorIndex, outPath));
    const data = await readFile(outPath);
    await unlink(outPath).catch(() => undefined);
    return data;
  },
};

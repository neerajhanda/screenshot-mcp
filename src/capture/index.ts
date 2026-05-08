import { detectPlatform } from "../platform.js";
import type { Backend } from "./types.js";

let backend: Backend | undefined;

export async function getBackend(): Promise<Backend> {
  if (backend) return backend;

  const platform = detectPlatform();
  switch (platform) {
    case "wsl": {
      const { wslBackend } = await import("./wsl.js");
      backend = wslBackend;
      break;
    }
    case "windows": {
      const { windowsBackend } = await import("./windows.js");
      backend = windowsBackend;
      break;
    }
    case "macos": {
      const { macosBackend } = await import("./macos.js");
      backend = macosBackend;
      break;
    }
    case "linux": {
      const { linuxBackend } = await import("./linux.js");
      backend = linuxBackend;
      break;
    }
  }

  return backend!;
}

export type { Backend, Monitor } from "./types.js";

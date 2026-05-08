import { readFileSync } from "node:fs";

export type Platform = "macos" | "linux" | "windows" | "wsl";

let cached: Platform | undefined;

export function detectPlatform(): Platform {
  if (cached) return cached;
  cached = compute();
  return cached;
}

function compute(): Platform {
  if (process.platform === "darwin") return "macos";
  if (process.platform === "win32") return "windows";
  if (process.platform === "linux") {
    if (process.env.WSL_DISTRO_NAME) return "wsl";
    try {
      const v = readFileSync("/proc/version", "utf8");
      if (/microsoft/i.test(v)) return "wsl";
    } catch {
      // /proc/version unreadable — assume native Linux
    }
    return "linux";
  }
  throw new Error(`Unsupported platform: ${process.platform}`);
}

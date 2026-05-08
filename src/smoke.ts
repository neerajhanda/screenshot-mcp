import { getBackend } from "./capture/index.js";
import { detectPlatform } from "./platform.js";

const platform = detectPlatform();
console.log(`Platform detected: ${platform}`);

const backend = await getBackend();

console.log("Listing monitors...");
const monitors = await backend.listMonitors();
console.log(JSON.stringify(monitors, null, 2));

if (monitors.length === 0) {
  console.error("No monitors found.");
  process.exit(1);
}

console.log(`Capturing monitor 0 (${monitors[0].width}x${monitors[0].height})...`);
const buf = await backend.capture(0);

// Validate PNG magic bytes: 0x89 0x50 0x4E 0x47
const isPng =
  buf[0] === 0x89 &&
  buf[1] === 0x50 &&
  buf[2] === 0x4e &&
  buf[3] === 0x47;

console.log(`Buffer size: ${buf.length} bytes`);
console.log(`Valid PNG magic bytes: ${isPng}`);

if (!isPng) {
  console.error("ERROR: output is not a valid PNG.");
  process.exit(1);
}

console.log("Smoke test passed.");

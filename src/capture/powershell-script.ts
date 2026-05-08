import { spawn } from "node:child_process";

export function buildListMonitorsScript(): string {
  return `
Add-Type -AssemblyName System.Windows.Forms
$screens = [System.Windows.Forms.Screen]::AllScreens
$parts = @()
for ($i = 0; $i -lt $screens.Length; $i++) {
    $s = $screens[$i]
    $name = $s.DeviceName -replace '\\\\', '\\\\'
    $parts += '{"index":' + $i + ',"width":' + $s.Bounds.Width + ',"height":' + $s.Bounds.Height + ',"primary":' + $s.Primary.ToString().ToLower() + ',"name":"' + $name + '","x":' + $s.Bounds.X + ',"y":' + $s.Bounds.Y + '}'
}
Write-Output ('[' + ($parts -join ',') + ']')
`.trim();
}

export function buildCaptureScript(index: number, outPath: string): string {
  // PowerShell strings use backtick as escape, not backslash — pass path as-is
  return `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$screens = [System.Windows.Forms.Screen]::AllScreens
$idx = ${index}
if ($idx -lt 0 -or $idx -ge $screens.Length) {
    Write-Error "Monitor index $idx out of range (0 to $($screens.Length - 1))"
    exit 1
}
$s = $screens[$idx]
$bmp = New-Object System.Drawing.Bitmap $s.Bounds.Width, $s.Bounds.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($s.Bounds.X, $s.Bounds.Y, 0, 0, $bmp.Size)
$bmp.Save("${outPath}", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
`.trim();
}

export function encodePs(script: string): string {
  return Buffer.from(script, "utf16le").toString("base64");
}

export function runPowershell(script: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const ps = spawn("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-EncodedCommand",
      encodePs(script),
    ]);

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    ps.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    ps.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));

    ps.on("close", (code) => {
      if (code !== 0) {
        const errText = Buffer.concat(stderr).toString("utf8").trim();
        reject(new Error(`PowerShell exited ${code}: ${errText}`));
      } else {
        resolve(Buffer.concat(stdout).toString("utf8").trim());
      }
    });

    ps.on("error", (err) => reject(err));
  });
}

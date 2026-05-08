import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type ReturnMode = "inline" | "path";

export type McpImageContent = {
  type: "image";
  mimeType: string;
  data: string;
};

export type McpTextContent = {
  type: "text";
  text: string;
};

export type McpContent = McpImageContent | McpTextContent;

export async function toMcpContent(
  buffer: Buffer,
  returnMode: ReturnMode,
  outputPath?: string
): Promise<McpContent[]> {
  if (returnMode === "inline") {
    return [
      {
        type: "image",
        mimeType: "image/png",
        data: buffer.toString("base64"),
      },
    ];
  }

  const filePath =
    outputPath ??
    join(tmpdir(), `screenshot-mcp-${new Date().toISOString().replace(/[:.]/g, "-")}.png`);

  await writeFile(filePath, buffer);
  return [{ type: "text", text: filePath }];
}

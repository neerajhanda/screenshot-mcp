#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getBackend } from "./capture/index.js";
import { toMcpContent } from "./output.js";

const server = new McpServer({
  name: "screenshot-mcp",
  version: "0.1.0",
});

server.tool("list_monitors", "List all connected monitors with their dimensions and indices.", {}, async () => {
  const backend = await getBackend();
  const monitors = await backend.listMonitors();
  return {
    content: [{ type: "text", text: JSON.stringify(monitors, null, 2) }],
  };
});

server.tool(
  "take_screenshot",
  "Capture a screenshot of a monitor. Returns the image inline (base64) or saves to disk.",
  {
    monitor: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Monitor index from list_monitors. 0 = primary."),
    return: z
      .enum(["inline", "path"])
      .default("inline")
      .describe("inline = base64 PNG in response; path = save to disk and return the file path."),
    path: z
      .string()
      .optional()
      .describe("Output file path. Only used when return=path. Defaults to a temp file."),
  },
  async (args) => {
    const backend = await getBackend();
    const monitors = await backend.listMonitors();

    if (args.monitor >= monitors.length) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Monitor index ${args.monitor} out of range. Available monitors: 0–${monitors.length - 1}. Use list_monitors to see all.`,
          },
        ],
      };
    }

    const buffer = await backend.capture(args.monitor);
    const content = await toMcpContent(
      buffer,
      args.return as "inline" | "path",
      args.path
    );

    return { content: content as { type: "image"; mimeType: string; data: string }[] | { type: "text"; text: string }[] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);

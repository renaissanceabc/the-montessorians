"use client";

import dynamic from "next/dynamic";

// Agentation: click elements to annotate them for coding agents. Development
// only, and loaded lazily so it never ships in production pages. Annotations
// sync to the local agentation MCP server (see .mcp.json).
const Agentation = dynamic(
  async () => {
    const mod = await import("agentation");
    return mod.Agentation;
  },
  {
    ssr: false,
  }
);

export const DevTools = () =>
  process.env.NODE_ENV === "development" ? <Agentation endpoint="http://localhost:4747" /> : null;

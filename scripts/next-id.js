#!/usr/bin/env node

/**
 * Prints the next unused permanent id.
 *
 *   bun run id:next          → next person id (tm0000067)
 *   bun run id:next -- org   → next organization id (tmo000004)
 *
 * Ids recorded in authority/changes.yaml count as used: an id is never reused.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const isOrg = process.argv.includes("org");
const [dir, prefix, width] = isOrg ? ["organizations", "tmo", 6] : ["data", "tm", 7];
const pattern = new RegExp(`^${prefix}(\\d{${width}})$`);

const used = [];
const fullDir = path.join(ROOT, dir);
for (const file of fs.existsSync(fullDir) ? fs.readdirSync(fullDir) : []) {
  if (file.endsWith(".yaml")) {
    used.push(yaml.load(fs.readFileSync(path.join(fullDir, file), "utf8"))?.id);
  }
}
for (const change of yaml.load(
  fs.readFileSync(path.join(ROOT, "authority", "changes.yaml"), "utf8")
) ?? []) {
  used.push(change.id);
}

const max = Math.max(0, ...used.map((id) => Number(pattern.exec(id ?? "")?.[1] ?? 0)));
console.log(`${prefix}${String(max + 1).padStart(width, "0")}`);

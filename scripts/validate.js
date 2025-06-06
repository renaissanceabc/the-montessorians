#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import yaml from "js-yaml";
import crypto from "node:crypto";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up AJV with formats
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateFormats: "fast"
});
addFormats(ajv);

// Load schema
const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "../profile.schema.json"), "utf8"));
const validate = ajv.compile(schema);

// Directories
const dataDir = path.join(__dirname, "../data");
const imageDir = path.join(__dirname, "../images");

// Get YAML files
const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".yaml"));

// Load checksum cache
const checksumPath = path.join(__dirname, "../.checksums.json");
let checksumCache = {};
if (fs.existsSync(checksumPath)) {
  const content = fs.readFileSync(checksumPath, "utf8").trim();
  if (content) {
    checksumCache = JSON.parse(content);
  }
}

function computeChecksum(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

let totalChecked = 0;
let totalValid = 0;
let totalSkipped = 0;
const invalidReports = [];

for (const file of files) {
  totalChecked++;
  const filePath = path.join(dataDir, file);
  const fileContent = fs.readFileSync(filePath, "utf8");
  const doc = yaml.load(fileContent);

  const slug = doc.slug;
  const expectedImagePath = path.join(imageDir, `${slug}.jpg`);
  const imageContent = fs.existsSync(expectedImagePath) ? fs.readFileSync(expectedImagePath) : "";

  const currentChecksum = computeChecksum(fileContent + imageContent);

  if (checksumCache[file] === currentChecksum) {
    totalSkipped++;
    continue;
  }

  const valid = validate(doc);
  const errors = [];

  if (!valid) {
    for (const err of validate.errors ?? []) {
      const loc = err.instancePath || "(root)";
      errors.push(`- ${loc}: ${err.message}`);
    }
  }

  // Tagline checks
  if (typeof doc.tagline === "string") {
    const tagline = doc.tagline.trim();
    if (tagline.endsWith(".")) {
      errors.push(`- /tagline: Tagline should not end with a period`);
    }
  }
  // Image checks
  const hasCorrectImage = fs.existsSync(expectedImagePath);
  const allImageFormats = [".jpeg", ".png", ".webp", ".gif", ".tiff", ".heic", ".heif", ".avif"];
  const altImagePath = allImageFormats
    .map((ext) => path.join(imageDir, `${slug}${ext}`))
    .find((altPath) => fs.existsSync(altPath));

  if (!hasCorrectImage) {
    if (altImagePath) {
      errors.push(`- Image found but not in .jpg format: ${path.basename(altImagePath)}`);
    } else {
      errors.push(`- Missing required image: /images/${slug}.jpg`);
    }
  }

  if (errors.length > 0) {
    invalidReports.push({ file, errors });
  } else {
    checksumCache[file] = currentChecksum;
    totalValid++;
  }
}

// Save updated checksums (even if no errors)
fs.writeFileSync(
  checksumPath,
  JSON.stringify(Object.fromEntries(Object.entries(checksumCache).sort(([a], [b]) => a.localeCompare(b))), null, 2)
);

// Summary output
console.log(`${totalChecked} profiles found`);
console.log(`- ${invalidReports.length} invalid`);
console.log(`- ${totalValid} validated`);
console.log(`- ${totalSkipped} skipped (already validated)`);

if (invalidReports.length > 0) {
  console.log("\n❌ Invalid:");
  invalidReports.forEach((report, index) => {
    console.log(`${index + 1}. ${report.file}`);
    for (const err of report.errors) {
      console.log(`  ${err}`);
    }
  });
  process.exit(1);
}

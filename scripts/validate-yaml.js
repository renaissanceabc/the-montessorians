#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import yaml from "js-yaml";

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up AJV with formats
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateFormats: "fast",
});
addFormats(ajv);

// Load schema
const schema = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../profile.schema.json"), "utf8")
);
const validate = ajv.compile(schema);

// Validate YAML files
const directory = path.join(__dirname, "../data");
const files = fs.readdirSync(directory).filter((f) => f.endsWith(".yaml"));

let hasErrors = false;

for (const file of files) {
  const filePath = path.join(directory, file);
  const doc = yaml.load(fs.readFileSync(filePath, "utf8"));
  const valid = validate(doc);

  if (!valid) {
    console.error(`❌ ${file} is invalid:`);
    console.error(validate.errors);
    hasErrors = true;
  } else {
    console.log(`✅ ${file} is valid`);
  }
}

if (hasErrors) process.exit(1);

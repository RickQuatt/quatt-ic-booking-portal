#!/usr/bin/env node
/* eslint-disable no-undef */

/**
 * Post-processing script to patch known OpenAPI Generator bugs in generated API client code.
 *
 * This script runs after API client generation to automatically fix TypeScript errors
 * in generated files that cannot be fixed at the source (OpenAPI spec or generator).
 *
 * Current patches:
 * 1. Device.ts - Add @ts-expect-error to DeviceFromJSONTyped function to suppress
 *    union type discrimination bug with 'name' property
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get directory path in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const rootDir = path.resolve(__dirname, "../");
const deviceFilePath = path.resolve(rootDir, "src/api-client/models/Device.ts");

/**
 * Patch Device.ts to add @ts-expect-error comment before the problematic return statement
 */
function patchDeviceFile() {
  console.log("🔧 Patching Device.ts for union type bug...");

  // Read the file
  let content = fs.readFileSync(deviceFilePath, "utf8");

  // Pattern to match: the return statement in DeviceFromJSONTyped function
  // We want to add a comment before "return {"
  const pattern =
    /(export function DeviceFromJSONTyped\([^)]*\)[^{]*\{[^}]*if[^}]*\}\s*)(return \{)/;

  // Check if already patched
  if (content.includes("@ts-expect-error")) {
    console.log("   ✅ Device.ts already patched, skipping");
    return;
  }

  // Add the @ts-expect-error comment
  const comment = `// @ts-expect-error - Known OpenAPI Generator bug with union type 'name' property discrimination
  // Type 'string | object | null | undefined' is not assignable to 'object | undefined'
  // This does not affect runtime behavior. See src/api-client/device-type-patch.ts for details.
  `;

  const replacement = `$1${comment}$2`;

  if (!pattern.test(content)) {
    console.warn(
      "   ⚠️  Warning: Could not find expected pattern in Device.ts. File structure may have changed.",
    );
    return;
  }

  // Apply the patch
  content = content.replace(pattern, replacement);

  // Write back to file
  fs.writeFileSync(deviceFilePath, content, "utf8");

  console.log("   ✅ Successfully patched Device.ts");
}

// Main function
function main() {
  try {
    console.log("🔧 Patching generated API models...");
    patchDeviceFile();
    console.log("✅ All patches applied successfully");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run the script
main();

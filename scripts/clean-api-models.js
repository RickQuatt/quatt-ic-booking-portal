#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get directory path in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const rootDir = path.resolve(__dirname, "../");
const openApiIgnorePath = path.resolve(
  rootDir,
  "src/api-client/.openapi-generator-ignore",
);
const modelsIndexPath = path.resolve(rootDir, "src/api-client/models/index.ts");

// Function to parse the .openapi-generator-ignore file and extract allowed model files
function getAllowedModels(ignorePath) {
  const content = fs.readFileSync(ignorePath, "utf8");
  const lines = content.split("\n");

  // Get all lines that start with !models/ and extract the model name
  return lines
    .filter((line) => line.startsWith("!models/"))
    .map((line) => {
      // Extract model name from the line (removing '.ts' and 'FromJSON'/'ToJSON' parts)
      const modelPath = line.slice("!models/".length);
      const modelName = modelPath
        .replace(".ts", "")
        .replace(/FromJSON|ToJSON/g, "");
      return modelName;
    })
    .filter(Boolean) // Remove empty entries
    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
}

// Function to clean the models/index.ts file
function cleanModelsIndex(indexPath, allowedModels) {
  // Read the index.ts file
  const content = fs.readFileSync(indexPath, "utf8");
  const lines = content.split("\n");

  // Keep only the header comments and exports for allowed models
  const filteredLines = lines.filter((line) => {
    // Keep header comments
    if (line.startsWith("/*")) return true;

    // Check if the line is an export statement
    if (line.startsWith(`export * from "./`)) {
      // Extract the model name from the export statement
      const modelName = line.slice(`export * from "./`.length, -2); // Remove 'export * from "./' and '"'

      // Keep the line only if the model is in the allowed list
      return allowedModels.includes(modelName);
    }

    // Keep empty lines and other non-export statements
    return !line.startsWith("export *");
  });

  // Write the cleaned content back to the file
  fs.writeFileSync(indexPath, filteredLines.join("\n"));

  console.log(`✅ Successfully cleaned ${indexPath}`);
  console.log(
    `   Kept ${filteredLines.filter((line) => line.startsWith("export *")).length} models out of ${lines.filter((line) => line.startsWith("export *")).length} total`,
  );
}

// Main function
function main() {
  try {
    console.log("🧹 Cleaning API models index.ts file...");
    const allowedModels = getAllowedModels(openApiIgnorePath);
    console.log(
      `📋 Found ${allowedModels.length} allowed models in .openapi-generator-ignore`,
    );

    cleanModelsIndex(modelsIndexPath, allowedModels);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run the script
main();

#!/bin/bash

# This script creates a single consolidated text file containing the entire codebase
# Primary use: Generate a comprehensive codebase snapshot for LLM (AI) analysis
#
# Features:
# - Combines specified source files into one text file
# - Configurable include/exclude patterns for file selection
# - Preserves file paths as comments before each file's content
# - Optional tree view of directory structure
# - Excludes test files, node_modules, and other non-essential files
# - Outputs to ./local_utilities/codebase directory by default
#
# Available flags:
# --pattern   : Add additional file/directory patterns to include
#               Example: --pattern "src/components" "src/utils"
#
# --exclude   : Add additional patterns to exclude from the output
#               Example: --exclude "*.test.ts" "temp/*"
#
# --output    : Specify custom output filename (default: output.txt)
#               Example: --output "codebase_snapshot.txt"
#
# --tree      : Include directory structure using tree command
#               Example: --tree
#
# Usage example:
# ./export_files.sh --pattern "src/models" --exclude "*.log" --output "custom.txt" --tree

# Create local_utilities directory if it doesn't exist
mkdir -p ./local_utilities/codebase

# Default output directory and file
OUTPUT_DIR="./local_utilities/codebase"
OUTPUT_FILE="output.md"

# Default hard-coded include patterns
DEFAULT_PATTERNS=("src")

# Default exclude patterns (updated to correctly exclude node_modules)
DEFAULT_EXCLUDE_PATTERNS=("node_modules" "*.test.ts" "*.spec.ts" "*.backup" "common" "dist" "bin" "*stories.tsx", "src/api-client")

# Function to display usage instructions
usage() {
  echo "Usage: $0 [--pattern PATTERN...] [--exclude EXCLUDE_PATTERN...] [--output OUTPUT_FILE]"
  exit 1
}

# Initialize arrays
PATTERNS=()
EXCLUDE_PATTERNS=()
TREE_FLAG=false

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
  --pattern)
    shift
    while [[ $# -gt 0 && ! $1 =~ ^-- ]]; do
      PATTERNS+=("$1")
      shift
    done
    ;;
  --exclude)
    shift
    while [[ $# -gt 0 && ! $1 =~ ^-- ]]; do
      EXCLUDE_PATTERNS+=("$1")
      shift
    done
    ;;
  --output)
    OUTPUT_FILE="$2"
    shift 2
    ;;
  --tree)
    TREE_FLAG=true
    shift
    ;;
  *)
    usage
    ;;
  esac
done

# Include default patterns
PATTERNS+=("${DEFAULT_PATTERNS[@]}")

# Include default exclude patterns
EXCLUDE_PATTERNS+=("${DEFAULT_EXCLUDE_PATTERNS[@]}")

# Ensure the output directory exists
mkdir -p "$OUTPUT_DIR"

# Full path to the output file
OUTPUT_PATH="$OUTPUT_DIR/$OUTPUT_FILE"

# Empty the output file if it exists
>"$OUTPUT_PATH"

# Root directory of the codebase (adjust if necessary)
ROOT_DIR="$(pwd)"

# Build include pattern arguments for find command
INCLUDE_ARGS=()
for pattern in "${PATTERNS[@]}"; do
  INCLUDE_ARGS+=(-o -path "*$pattern*")
done
# Remove the first -o
INCLUDE_ARGS=("${INCLUDE_ARGS[@]:1}")

# Build the prune arguments for excluding directories
EXCLUDE_ARGS=()
for exclude_pattern in "${EXCLUDE_PATTERNS[@]}"; do
  # If it's a directory (e.g., node_modules), prune it
  if [[ "$exclude_pattern" == "node_modules" ]]; then
    EXCLUDE_ARGS+=(-path "*/$exclude_pattern" -prune -o)
  else
    # For other patterns, exclude files as before
    EXCLUDE_ARGS+=(-not -path "$ROOT_DIR/$exclude_pattern")
  fi
done

if $TREE_FLAG; then

  # Check if tree command exists
  if ! command -v tree &>/dev/null; then
    echo "Error: tree command is not installed. Please install tree to use this script. (EG: brew install tree)"
    exit 1
  fi
  echo "Quatt Cloud Monorepo Codebase Directory Structure (Excluding certain folders)" >>"$OUTPUT_PATH"
  tree src >>"$OUTPUT_PATH"
fi

# Combine the find command to improve performance
find "$ROOT_DIR" \( "${EXCLUDE_ARGS[@]}" \) -type f \( "${INCLUDE_ARGS[@]}" \) -print0 | while IFS= read -r -d '' file; do
  # Get the relative file path from the root directory
  relative_path="${file#$ROOT_DIR/}"
  echo "#### File path: $relative_path" >>"$OUTPUT_PATH"
  cat "$file" >>"$OUTPUT_PATH"
  echo -e "\n" >>"$OUTPUT_PATH" # Separate files with a newline
done

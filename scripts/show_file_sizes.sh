#!/bin/bash

# =============================================================================
# File Size Analysis Script
# =============================================================================
# 
# PURPOSE:
# This script analyzes and lists files in a directory (and its subdirectories) 
# by size, helping identify large files in the codebase. Results are saved to 
# ./local_utilities/file_sizes.txt
#
# USAGE:
#   ./show_file_sizes.sh [--pattern PATTERN...] [--exclude EXCLUDE_PATTERN...] [directory]
#
# OPTIONS:
#   --pattern PATTERN      Specify file patterns to include (e.g., "*.js" "*.ts")
#                         Default: "*" (all files)
#
#   --exclude PATTERN     Specify patterns to exclude from search
#                         Default excludes: "*/node_modules/*" "*/.git/*" 
#                         "*/dist/*" "*/local_utilities/*"
#
#   directory             Target directory to scan (default: current directory)
#
# EXAMPLES:
#   # Scan current directory with default settings:
#   ./show_file_sizes.sh
#
#   # Scan only JavaScript and TypeScript files:
#   ./show_file_sizes.sh --pattern "*.js" "*.ts"
#
#   # Exclude additional directories:
#   ./show_file_sizes.sh --exclude "*/build/*" "*/temp/*"
#
#   # Scan specific directory:
#   ./show_file_sizes.sh /path/to/directory
#
# OUTPUT:
#   Creates ./local_utilities/file_sizes.txt with files sorted by size (largest first)
#   Format: <size> <filepath>
#
# =============================================================================


# Default patterns and exclude patterns
DEFAULT_PATTERNS=("*")
DEFAULT_EXCLUDE_PATTERNS=("*/node_modules/*" "*/.git/*" "*/dist/*" "*/local_utilities/*")

# Initialize arrays with default patterns
PATTERNS=("${DEFAULT_PATTERNS[@]}")
EXCLUDE_PATTERNS=("${DEFAULT_EXCLUDE_PATTERNS[@]}")
DIR=""

# Function to display usage instructions
usage() {
  echo "Usage: $0 [--pattern PATTERN...] [--exclude EXCLUDE_PATTERN...] [directory]"
  exit 1
}

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case "$key" in
    --pattern)
      shift
      PATTERNS=()
      if [[ $# -eq 0 ]]; then
        echo "Error: --pattern requires at least one pattern"
        exit 1
      fi
      while [[ $# -gt 0 && ! "$1" =~ ^-- ]]; do
        PATTERNS+=("$1")
        shift
      done
      ;;
    --exclude)
      shift
      EXCLUDE_PATTERNS=()
      if [[ $# -eq 0 ]]; then
        echo "Error: --exclude requires at least one pattern"
        exit 1
      fi
      while [[ $# -gt 0 && ! "$1" =~ ^-- ]]; do
        EXCLUDE_PATTERNS+=("$1")
        shift
      done
      ;;
    -h|--help)
      usage
      ;;
    --)
      shift
      break
      ;;
    *)
      break
      ;;
  esac
done

# Any remaining arguments are positional arguments
if [[ $# -gt 0 ]]; then
  DIR="$1"
  shift
else
  DIR="."
fi

# If there are extra arguments, show usage
if [[ $# -gt 0 ]]; then
  echo "Unknown arguments: $@"
  usage
fi

# Create local_utilities directory if it doesn't exist
mkdir -p ./local_utilities

# Build exclude pattern arguments for find command
EXCLUDE_ARGS=()
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
  EXCLUDE_ARGS+=( ! -path "$pattern" )
done

# Build include pattern arguments for find command
INCLUDE_ARGS=()
for pattern in "${PATTERNS[@]}"; do
  INCLUDE_ARGS+=( -o -name "$pattern" )
done
# Remove the first -o
if [ ${#INCLUDE_ARGS[@]} -gt 0 ]; then
  INCLUDE_ARGS=( "${INCLUDE_ARGS[@]:1}" )
fi

# Build the find expression
FIND_EXPR=()
FIND_EXPR+=( "${EXCLUDE_ARGS[@]}" )

if [ ${#INCLUDE_ARGS[@]} -gt 0 ]; then
  FIND_EXPR+=( -type f \( "${INCLUDE_ARGS[@]}" \) )
else
  FIND_EXPR+=( -type f )
fi

# Run the find command
find "$DIR" "${FIND_EXPR[@]}" -exec ls -lh {} + | awk '{ print $5, $9 }' | sort -hr > ./local_utilities/file_sizes.txt

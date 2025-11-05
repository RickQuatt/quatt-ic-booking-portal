---
allowed-tools: Bash, Grep, Read
argument-hint: [target-branch]
description: Create commit, push branch, and open pull request with smart commit messages
---

# GitHub Pull Request Workflow

## Overview
Automates the commit → push → PR creation workflow with intelligent commit message generation based on branch naming.

## Your Instructions

### **Step 1: Check Git Status**
1. Run `git status --porcelain` to check for uncommitted changes
2. Run `git branch --show-current` to get current branch name
3. If no changes and branch is already pushed, skip to Step 4

### **Step 2: Create Commit (if needed)**
1. **Extract ticket number from branch name**:
   - Look for patterns like `qpd-1234`, `QPD-1234`, `qpd-1234-feature-name`
   - Case insensitive matching
   - If found, use format: `[QPD-1234]`
   - If not found, use format: `[Task]`

2. **Generate commit message**:
   - **First line**: `[QPD-XXXX] Brief description` or `[Task] Brief description`
   - **Additional lines**: 1-3 more lines with context about the changes
   - Keep total message under 4 lines
   - Be concise but descriptive

3. **Create commit**:
   ```bash
   git add .
   git commit -m "$(cat <<'EOF'
   [QPD-XXXX] Brief description
   - Context line 1
   - Context line 2
   EOF
   )"
   ```
   **IMPORTANT**: NEVER use `--no-verify` flag unless user explicitly requests it. Pre-commit hooks ensure code quality and must be respected.

### **Step 3: Push Branch**
1. Push current branch to origin using explicit branch name: `git push -u origin <branch-name>`
2. NEVER use `HEAD` - always use the explicit branch name from `git branch --show-current`
3. Handle any push errors (authentication, conflicts, etc.)

### **Step 4: Create Pull Request**
1. **Determine target branch**: Use argument if provided, otherwise default to `develop`
2. **Generate PR title**: Same as commit message first line
3. **Generate PR body**:
   ```markdown
   ## Summary
   - Brief bullet points of changes
   
   ## Test plan
   - [ ] Relevant tests pass
   - [ ] Manual testing completed
   
   🤖 Generated with [Claude Code](https://claude.ai/code)
   ```

4. **Create PR**: `gh pr create --title "PR Title" --body "$(cat <<'EOF'...)`

### **Error Handling**
- Check if `gh` CLI is authenticated
- Handle merge conflicts during push
- Verify target branch exists
- **Pre-commit hook failures**: If commit fails due to linting/type errors, inform user they need to fix issues first
- **NEVER bypass pre-commit hooks** with `--no-verify` unless explicitly requested by user
- Provide clear error messages for each failure point

### **Branch Name Patterns**
Examples of supported branch name patterns:
- `qpd-1234-fix-validation` → `[QPD-1234]`
- `QPD-5678-home-battery-feature` → `[QPD-5678]`
- `feature-refactor-services` → `[Task]`
- `bugfix-timezone-handling` → `[Task]`

## Usage Examples

```bash
# Create PR to develop branch (default)
/gh:pr

# Create PR to specific target branch
/gh:pr main

# Create PR to feature branch
/gh:pr feature/home-battery
```

## Implementation Notes

- Always use HEREDOC format for multi-line commit/PR messages
- Extract meaningful context from `git diff --cached` for commit messages
- Use `git log --oneline -1` to check if commit already exists
- Respect existing commit messages if changes are already committed
---
allowed-tools: mcp__atlassian-jira__getJiraIssue, mcp__atlassian-jira__searchJiraIssuesUsingJql, mcp__atlassian-jira__addCommentToJiraIssue, Bash, Task, Grep, Read, Glob, TodoWrite, MultiEdit, Write
argument-hint: [QPD-XXXX] [--auto-execute] [--auto-commit] [--auto-pr]
description: Start work on a Jira ticket by creating branch, planning, and optionally executing with auto-commit/PR
---

# Jira Begin Task Command

## Project Information

- **Project**: QPD (Quatt Product Development)
- **Cloud ID**: `e00d2e3c-9946-4be6-b81a-0bb231fc50c7`
- **Team**: Cloud / Backend (ID: `02cafcb6-31c2-47db-a9e4-afb152e80a6f`)
- **Default Target Branch**: develop
- **Labels**: Claude-Created

## Task Context

User provided input: **$ARGUMENTS**

## Your Instructions

### **Step 1: Parse Arguments**

1. **Extract ticket ID**: Look for QPD-XXXX pattern (case insensitive)
2. **Parse flags**:
   - `--auto-execute`: Execute implementation without approval (assuming auto accept is enabled)
   - `--auto-commit`: Automatically commit changes after implementation
   - `--auto-pr`: Automatically create PR after commit

### **Step 2: Fetch Jira Ticket**

1. Use `mcp__atlassian-jira__getJiraIssue` to fetch ticket details:
   - Summary
   - Description
   - Issue Type (Bug, Task, Story, etc.)
   - Priority
   - Current Status
   - Parent/Epic information

2. If ticket not found, inform user and stop

### **Step 3: Create Feature Branch**

1. **Ensure clean working directory**:

   ```bash
   git status --porcelain
   ```

   If there are uncommitted changes, inform user to commit or stash them first

2. **Update develop branch**:

   ```bash
   git checkout develop
   git pull origin develop
   ```

3. **Generate branch name**:
   - Convert ticket ID to lowercase (QPD-9999 → qpd-9999)
   - Map issue type to branch prefix:
     - Bug → `bug/`
     - Task → `feat/`
     - Story → `feat/`
     - Feature → `feat/`
     - Other → `task/`
   - Generate short description from Jira summary (kebab-case, max 5 words)
   - Format: `qpd-xxxx/<type>/<short-description>`
   - Example: `qpd-9999/bug/fix-validation-error`

4. **Create and checkout branch**:
   ```bash
   git checkout -b <branch-name>
   ```

### **Step 4: Analyze Codebase**

Use the Task tool with general-purpose agent for comprehensive codebase analysis:

1. **Identify relevant code areas** based on ticket description
2. **Find similar implementations** for reference
3. **Locate test files** that need updates
4. **Check for existing patterns** to follow

Example Task prompt:

```
Analyze the codebase for Jira ticket QPD-XXXX: "<summary>"

Description: <description>

Please:
1. Search for files and modules related to this feature/bug
2. Find similar implementations or patterns in the codebase
3. Identify test files (unit and e2e) that need updates
4. Check if API schemas or routes need changes
5. List potential edge cases or concerns
6. Return a concise summary of findings
```

Note: The Task tool runs independently with its own context, providing a comprehensive analysis without cluttering the main conversation.

### **Step 5: Generate Implementation Plan**

Create a comprehensive plan using TodoWrite tool with items like:

1. **Code Implementation**:
   - Main feature/fix implementation
   - Service layer changes
   - Repository layer changes
   - API route updates (if needed)

2. **Testing Requirements**:
   - Unit tests for services
   - Unit tests for repositories
   - E2E tests for API endpoints
   - Update existing tests if needed

3. **Documentation & Schema**:
   - OpenAPI schema updates
   - TypeScript type generation
   - MEMORY.md documentation

4. **Validation Steps**:
   - Run build: `npm run build`
   - Run linter: `npm run eslint`
   - Run unit tests: `npm run test:unit:specific -- <relevant-pattern>`
   - Run e2e tests: `npm run test:e2e:specific -- <relevant-pattern>`

### **Step 6: Present Plan or Auto-Execute**

1. **If `--auto-execute` NOT present**:
   - Present the plan to user for review
   - Wait for approval before proceeding
   - User can modify plan if needed

2. **If `--auto-execute` present**:
   - Add comment to Jira ticket: "Started automated implementation"
   - Begin executing the plan immediately
   - Update TodoWrite items as you progress

### **Step 7: Implementation**

Execute the plan items:

- Make code changes following existing patterns
- Write comprehensive tests
- Ensure all validation passes
- Update TodoWrite status as you complete items

### **Step 8: Auto-Commit (if flag present)**

If `--auto-commit` flag is present:

1. **Run validation**:

   ```bash
   npm run build
   npm run eslint
   npm run test:unit:specific -- <affected-modules> (if created/updated)
   npm run test:e2e:specific -- <affected-modules> (if created/updated)
   ```

2. **Stage changes**:

   ```bash
   git add .
   ```

3. **Generate commit message**:

   ```bash
   git commit -m "$(cat <<'EOF'
   [QPD-XXXX] <Jira Summary>

   - <Main implementation point>
   - Added unit tests for <modules>
   - Added e2e tests for <endpoints>
   - <Any other significant changes>
   EOF
   )"
   ```

### **Step 9: Auto-PR (if flag present)**

If `--auto-pr` flag is present:

1. **Push branch**:

   ```bash
   git push -u origin <branch-name>
   ```

2. **Create PR**:

   ```bash
   gh pr create --title "[QPD-XXXX] <Jira Summary>" \
     --body "$(cat <<'EOF'
   ## Summary

   Resolves: [QPD-XXXX](https://quatt-team.atlassian.net/browse/QPD-XXXX)

   <Brief description of changes>

   ## Changes
   - <List main changes>
   - <Tests added>
   - <Documentation updated>

   ## Test Plan
   - [x] Unit tests pass
   - [x] E2E tests pass
   - [x] Build succeeds
   - [x] Linting passes
   - [ ] Manual testing completed

   🤖 Generated with [Claude Code](https://claude.ai/code)
   EOF
   )"
   ```

3. **Update Jira ticket**:
   - Add comment with PR link
   - Optionally transition status if appropriate

### **Step 10: Final Report**

Provide user with:

- Branch name created
- Jira ticket link: `https://quatt-team.atlassian.net/browse/QPD-XXXX`
- PR link (if created): Output from gh command
- Summary of work completed
- Any manual steps remaining

## Error Handling

- **Uncommitted changes**: Stop and ask user to commit/stash first
- **Ticket not found**: Verify ticket ID and project
- **Branch conflicts**: Suggest alternative branch name
- **Build/test failures**: Report errors and stop auto-commit
- **GH CLI auth**: Check `gh auth status` and guide user if needed
- **Network issues**: Retry with exponential backoff

## Usage Examples

```bash
# Basic usage - creates branch and plan
/jira:begin-task QPD-9999

# Auto-execute without waiting for approval
/jira:begin-task QPD-9999 --auto-execute

# Full automation
/jira:begin-task QPD-9999 --auto-execute --auto-commit --auto-pr

# Just planning, but auto-commit when done
/jira:begin-task QPD-9999 --auto-commit
```

## Implementation Notes

- Always use lowercase for ticket ID in branch names
- Follow existing code patterns from CLAUDE.md
- Include comprehensive tests as per standards
- Update MEMORY.md with lessons learned
- Respect pre-commit hooks (never use --no-verify)
- Use Task tool for complex analysis that needs independent context
- Use direct Grep/Glob/Read tools for quick, specific searches
- TodoWrite helps track progress and keeps user informed

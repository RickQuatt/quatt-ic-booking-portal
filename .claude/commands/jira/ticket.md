---
allowed-tools: Bash, Grep, Read, Glob
argument-hint: [QPD-XXXX update-text OR new-issue-description]
description: Create or update QPD (Quatt Product Development) tickets for bugs, tasks, and features
---

# QPD Ticket Management

## Project Information

- **Project**: QPD (Quatt Product Development)
- **Cloud ID**: `e00d2e3c-9946-4be6-b81a-0bb231fc50c7`
- **Team**: Cloud / Backend (ID: `02cafcb6-31c2-47db-a9e4-afb152e80a6f`)
- **Sprint Field**: `customfield_10020` (use sprint ID as number)
- **Main Epics**:
  - QPD-7154: SW&I Technical Debt (parent: QPD-45 App Initiative)
  - QPD-152: Production Incidents/Maintenance - App/Backend (parent: QPD-45 App Initiative)
- **Active Backend Feature Epics**:
  - QPD-84: App - Home Battery support
  - QPD-178: Dynamic pricing support
  - QPD-8122: Automated E2E Hybrid commissioning
  - QPD-8123: Align on AsyncAPI document & process
  - QPD-6562: CHILL | Dongle | Data ingestion + dashboards
- **Labels**: Claude-Created

## Team Member Assignments

When user requests assignment to specific team members, use these Jira account IDs:

- **Andrea Florio**: `712020:61b18601-f88c-4652-9c5b-101a291e19e7`
- **Safier Al Khafaji**: `712020:84db093f-0876-42af-a993-9ab1b0fbed8a`
- **Ricardo.j**: `712020:d7c7d848-a5f5-490c-a322-b41a98f56292`
- **Ricardo Toledo Ceja**: `712020:4dfbaae9-8492-4298-a5c8-c2de929f40db`
- **Noah Clark**: `712020:585ec77c-8f96-40a2-97d7-7946a7ef7a93`
- **Martijn Pannevis**: `712020:2ab2fe07-9d3c-464c-ba39-0ee99ba946a1`
- **Gabriel.k**: `712020:35bc5b9c-cf52-4891-b733-2c80ab7cf128`
- **Mikael Labrut**: `712020:6b01307a-2b10-4946-b2bc-f323c952f3fe`

## Task Context

User provided input: **$ARGUMENTS**

## Your Instructions

### **Mode Detection**

1. **UPDATE Mode**: If arguments start with "QPD-" followed by numbers (e.g., "QPD-9999 issue resolved")
   - Extract ticket key (QPD-XXXX) and update text
   - Use `getJiraIssue` to fetch current ticket details
   - Add comment with update text using `addCommentToJiraIssue`
2. **CREATE Mode**: Otherwise, treat as new ticket creation
   - Use entire argument as issue description
   - Analyze and create new QPD ticket

### **CREATE Mode Instructions**

1. **Analyze the description** to determine:
   - Is this a **Bug** (fixing errors, validation issues, unexpected behavior) or a **Task** (new features, improvements)?
   - What priority should this have? (Low/Medium/High based on impact)
   - Which epic should this belong to? (QPD-7154 for technical debt, QPD-152 for production issues, or ask user)
   - Does the description mention sprint assignment? (e.g., "set to current sprint", "add to SW&I sprint")

2. **For Tasks**: Review relevant codebase areas to understand implementation requirements. Provide context but don't over-engineer the description.

3. **For Bugs**:
   - **CRITICAL**: Only include information you are confident about
   - Search codebase if needed to identify potential causes
   - DO NOT provide incorrect information - focus on the problem description
   - If you identify a likely cause, mention it but be clear about confidence level

4. **Create the ticket** with:
   - **Summary**: Short and simple (under 60 characters)
   - **Description**: Clear, concise, without LLM fluff
   - **Issue Type**: Bug or Task
   - **Priority**: Low/Medium/High
   - **Parent**: QPD-7154 (Technical Debt) or QPD-152 (Production) - ask if unsure
   - **Team**: Cloud / Backend (use team ID: `02cafcb6-31c2-47db-a9e4-afb152e80a6f`)
   - **Labels**: Claude-Created

#### Ticket Description Templates (For Task)

(Markdown headers are for how the ticket description should be structured)

# Summary

<!-- Provide a brief summary of the task to be completed. This should give an overview of what the task entails and its purpose. -->

# Feature Requirements

<!-- Please provide a detailed description of the task to be completed. Include any specific requirements, goals, or outcomes expected from this task. Should included a bulleted list of high level features this task should provide -->

# Technical Notes

<!-- Include any technical details, considerations, or constraints that should be taken into account while working on this task. This may include technologies to be used, architectural decisions, or any other relevant technical information. -->

# Unique Testing Requirements

<!-- Any extra testing requirements that are needed should be listed here, if no additional testing requirements are needed (outside of what CI does automatically for PRs), for example running a manual regression of the All-E Commissioning, if nothing else is neeed, please write "N/A" -->

<!-- End of Task Template -->

#### Ticket Description Templates (For Bug)

# Steps to reproduce:

<!-- Provide a step-by-step list of actions needed to reproduce the bug. Be as detailed as possible to ensure others can follow the same steps. -->

# Expected behavior:

<!-- Describe what you expected to happen when following the steps above. -->

# Actual behavior:

<!-- Describe what actually happened when following the steps above. Include any error messages or unexpected outcomes. -->

# Build:

<!-- Specify the build version of the software where the bug was observed. -->

# Device:

<!-- Specify the device model and any relevant hardware details where the bug was observed. -->

# OS version:

<!-- Specify the operating system version where the bug was observed if relevatn. -->

# Firmware version:

<!-- Specify the firmware version of the device where the bug was observed if relevant. (For example CIC Firmware 3.0.0) -->

# Additional info:

<!-- Include any other relevant information that may help in diagnosing or fixing the bug. This could include logs, screenshots, or related issues. -->

<!-- End of Bug Template -->

5. **Handle Sprint Assignment** (only if explicitly requested):
   - If user mentions "current sprint", "SW&I sprint", or similar sprint-related terms:
     - Search for active SW&I sprints using JQL: `project = QPD AND sprint in openSprints() AND sprint ~ "SW&I" ORDER BY updated DESC`
     - Find the active sprint (state = "active") with SW&I prefix
     - Use `editJiraIssue` to update `customfield_10020` with the sprint ID as a number
   - **Important**: Only set sprint when explicitly requested - don't assume all tickets need sprint assignment

### **UPDATE Mode Instructions**

1. **Parse the input**:
   - Extract ticket key (e.g., "QPD-9999")
   - Extract update text (everything after the ticket key)

2. **Fetch existing ticket**:
   - Use `getJiraIssue` to retrieve current ticket details
   - Understand the context of what's being updated

3. **Add comment**:
   - Use `addCommentToJiraIssue` to add the update text as a comment
   - Format comment with relevant context if needed

### **Key Requirements**

- Be discerning and accurate - no wild goose chases
- Focus on the actual problem, not speculation
- Keep descriptions factual and actionable
- Use the `acli` command-line tool for all Jira operations
- If additional research reveals more information, update the ticket with relevant details

### **Available ACLI Commands**

Use the `acli` command-line tool via Bash for all Jira operations:

- `acli jira workitem create`: Create new tickets
- `acli jira workitem get`: Retrieve existing ticket details
- `acli jira workitem comment`: Add comments to existing tickets
- `acli jira workitem update`: Update ticket fields

**ACLI Command Format Examples:**

```bash
# Create a bug ticket
acli jira workitem create --project QPD --type Bug --summary "..." --description "..." --parent QPD-152 --priority Medium

# Get ticket details
acli jira workitem get --issue QPD-9999

# Add comment to ticket
acli jira workitem comment --issue QPD-9999 --comment "..."

# Update ticket fields
acli jira workitem update --issue QPD-9999 --field priority --value High
```

### **After Operation**

- **ALWAYS provide the ticket URL** in this format: `https://quatt-team.atlassian.net/browse/[TICKET-KEY]`
- Example: `https://quatt-team.atlassian.net/browse/QPD-9999`
- Include brief confirmation of what was created or updated

## Codebase Context

This is the Quatt Cloud Node.js/TypeScript backend system managing ~15K IoT heating devices. Key areas:

- API endpoints in `src/routes/api/v1/`
- Services in `src/services/`
- Database layer in `src/repository/`
- Background workers in `src/worker.ts`, `src/timeWorker.ts`
- Device management in `src/devices/`
- Commissioning workflows in `src/commissioning/`

Search the codebase as needed to understand the context and provide accurate information in your ticket description.

## Usage Examples

**CREATE Examples:**

```
/jira:ticket Fix tariff validation error when editing single tariff entry
→ Creates new QPD Bug ticket with codebase analysis

/jira:ticket Add connectivity status field to HomeBattery API response
→ Creates new QPD Task ticket for feature implementation
```

**UPDATE Examples:**

```
/jira:ticket QPD-9999 issue reproduced, investigating database timezone handling
→ Adds comment to QPD-9999 with investigation progress

/jira:ticket QPD-8888 PR merged, ready for testing in develop environment
→ Adds comment to QPD-8888 with development status
```

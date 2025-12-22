---
allowed-tools: Bash, Grep, Read, Glob
argument-hint: [CHG-XX update-text OR new-change-title]
description: Create or update CHG (Software Change Management) tickets for deployments and infrastructure changes
---

# CHG Change Management

## Project Information

- **Project**: CHG (Software Change Management)
- **Cloud ID**: `e00d2e3c-9946-4be6-b81a-0bb231fc50c7`
- **Issue Type**: Change (ID: `10293`)
- **Team**: Cloud / Backend (ID: `02cafcb6-31c2-47db-a9e4-afb152e80a6f`)
- **Labels**: Claude-Created

## Team Member Assignments

When user requests assignment to specific team members, use these Jira account IDs:

- **Andrea Florio**: `712020:61b18601-f88c-4652-9c5b-101a291e19e7`
- **Safier Al Khafaji**: `712020:84db093f-0876-42af-a993-9ab1b0fbed8a`
- **Ricardo.j**: `712020:d7c7d848-a5f5-490c-a322-b41a98f56292`
- **Noah Clark**: `712020:585ec77c-8f96-40a2-97d7-7946a7ef7a93`
- **Martijn Pannevis**: `712020:2ab2fe07-9d3c-464c-ba39-0ee99ba946a1`
- **Gabriel.k**: `712020:35bc5b9c-cf52-4891-b733-2c80ab7cf128`
- **Mikael Labrut**: `712020:6b01307a-2b10-4946-b2bc-f323c952f3fe`

## Task Context

User provided input: **$ARGUMENTS**

## Your Instructions

### **Mode Detection**

1. **UPDATE Mode**: If arguments start with "CHG-" followed by numbers (e.g., "CHG-35 deployment completed")
   - Extract ticket key (CHG-XX) and update text
   - Use `getJiraIssue` to fetch current ticket details
   - Add comment with update text using `addCommentToJiraIssue`
2. **CREATE Mode**: Otherwise, treat as new ticket creation
   - Use entire argument as change title/summary
   - Create new CHG ticket with structured description

### **CREATE Mode Instructions**

1. **Analyze the change title** to determine:
   - **Change Type**: Release deployment, configuration change, infrastructure update, firmware deployment
   - **Impact Level**: Low/Medium/High based on system impact
   - **System/Component**: Quatt Cloud, CIC firmware, configuration, infrastructure

2. **Create the CHG ticket** with:
   - **Summary**: Use the provided title as-is (e.g., "Quatt Cloud release/v2.14.0")
   - **Description**: Create a concise description using template below
   - **Issue Type**: Change
   - **Priority**: Medium (default for releases), High (for critical/security), Low (for minor config)
   - **Team**: Cloud / Backend (use team ID: `02cafcb6-31c2-47db-a9e4-afb152e80a6f`)
   - **Assignee**: Default to Noah Clark unless user specifies otherwise
   - **Labels**: Claude-Created

3. **Description Template for CREATE**:

   ```
   **Purpose**: [Brief description of what this change accomplishes]

   **Components Affected**:
   - [List of systems, services, or components being changed]

   **Risk Assessment**: [Low/Medium/High] - [Brief justification]

   **Rollback Strategy**: [Brief mention of how to revert if needed]
   ```

### **UPDATE Mode Instructions**

1. **Parse the input**:
   - Extract ticket key (e.g., "CHG-35")
   - Extract update text (everything after the ticket key)

2. **Fetch existing ticket**:
   - Use `acli jira workitem get --issue CHG-XX` to retrieve current ticket details
   - Understand the context of what's being updated

3. **Add comment**:
   - Use `acli jira workitem comment --issue CHG-XX --comment "..."` to add the update text as a comment
   - Format comment with timestamp context if relevant

### **Common Change Types**

- **Releases**: "Quatt Cloud release/v2.14.0" - application deployments
- **Firmware**: "Deploy CIC firmware 3.8.0-beta" - device firmware updates
- **Configuration**: "Change Zendesk issue code field" - system configuration updates
- **Infrastructure**: Server, database, or service infrastructure changes

### **Priority Guidelines**

- **High**: Security fixes, critical bugs, production incidents
- **Medium**: Regular releases, feature deployments, minor config changes
- **Low**: Documentation updates, non-critical configuration tweaks

### **Key Requirements**

- Keep descriptions factual and concise
- Focus on operational impact, not technical implementation details
- Always include risk assessment and rollback considerations for CREATE
- Use the `acli` command-line tool for all Jira operations
- Default assignee to Noah Clark for deployment-related changes

### **Available ACLI Commands**

Use the `acli` command-line tool via Bash for all Jira operations:

- `acli jira workitem create`: Create new change tickets
- `acli jira workitem get`: Retrieve existing ticket details
- `acli jira workitem comment`: Add comments to existing tickets
- `acli jira workitem update`: Update ticket fields

**ACLI Command Format Examples:**

```bash
# Create a CHG ticket
acli jira workitem create --project CHG --type Change --summary "Quatt Cloud release/v2.14.0" --description "..." --priority Medium

# Get CHG ticket details
acli jira workitem get --issue CHG-35

# Add comment to CHG ticket
acli jira workitem comment --issue CHG-35 --comment "Deployment completed successfully"

# Update CHG ticket field
acli jira workitem update --issue CHG-35 --field status --value "Completed"
```

### **After Operation**

- **ALWAYS provide the ticket URL** in this format: `https://quatt-team.atlassian.net/browse/[TICKET-KEY]`
- Example: `https://quatt-team.atlassian.net/browse/CHG-35`
- Include brief confirmation of what was created or updated

## Usage Examples

**CREATE Examples:**

```
/jira:change Quatt Cloud release/v2.14.0
→ Creates new CHG ticket with structured description

/jira:change Deploy CIC firmware 3.8.0-beta to beta testers
→ Creates firmware deployment change ticket
```

**UPDATE Examples:**

```
/jira:change CHG-35 deployment completed successfully, all services healthy
→ Adds comment to CHG-35 with deployment status

/jira:change CHG-36 rollback initiated due to database connection issues
→ Adds comment to CHG-36 with rollback information
```

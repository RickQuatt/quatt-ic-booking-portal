---
allowed-tools: Bash, Grep, Read, Glob
argument-hint: [Cloud v2.15.0 release-notes OR existing-version-update]
description: Create or update QPD releases and associated CHG change management tickets
---

# QPD Release Management

## Project Information

- **QPD Project**: QPD (Quatt Product Development) - for version creation
- **CHG Project**: CHG (Software Change Management) - for change tickets
- **Cloud ID**: `e00d2e3c-9946-4be6-b81a-0bb231fc50c7`
- **Team**: Cloud / Backend (ID: `02cafcb6-31c2-47db-a9e4-afb152e80a6f`)
- **Version Pattern**: `Cloud v<semver>` (e.g., `Cloud v2.15.0`)
- **Labels**: Claude-Created

## Team Member Assignments

Default assignee for release-related tickets:

- **Noah Clark**: `712020:585ec77c-8f96-40a2-97d7-7946a7ef7a93`

## Task Context

User provided input: **$ARGUMENTS**

## Your Instructions

### **Mode Detection**

1. **UPDATE Mode**: If arguments start with existing version pattern "Cloud v" followed by semver (e.g., "Cloud v2.15.0 deployed successfully")
   - Check if version already exists in QPD project
   - Find associated CHG ticket for this release
   - Add update comment to CHG ticket
2. **CREATE Mode**: Otherwise, treat as new release creation
   - Parse version from input (e.g., "Cloud v2.15.0")
   - Create QPD release version
   - Create associated CHG change ticket
   - Link them together

### **CREATE Mode Instructions**

1. **Parse Release Information**:
   - Extract version from input (e.g., "Cloud v2.15.0")
   - Extract any release notes or description from remaining text
   - Validate semver format (major.minor.patch)

2. **Create QPD Release Version**:
   - **Note**: Jira versions are typically created through Project Settings, not API
   - Search for existing version first to avoid duplicates
   - Document the version ID for ticket association

3. **Create CHG Change Ticket**:
   - **Summary**: `Quatt Cloud Release v{version}` (e.g., "Quatt Cloud Release v2.15.0")
   - **Description**: Structured change description
   - **Issue Type**: Change (ID: `10293`)
   - **Priority**: Medium (default for releases)
   - **Team**: Cloud / Backend
   - **Assignee**: Noah Clark
   - **Labels**: Claude-Created

4. **CHG Ticket Description Template**:

   ```
   **Purpose**: Deploy Quatt Cloud release v{version} to production environment

   **Release Content**:
   {release_notes_or_summary}

   **Risk Assessment**: Medium - Standard release deployment following established CI/CD pipeline

   **Rollback Strategy**:
   - Database migrations can be rolled back if needed
   - Previous container images available for immediate rollback

   **Related QPD Release**: Cloud v{version}
   ```

### **UPDATE Mode Instructions**

1. **Parse Update Information**:
   - Extract version (e.g., "Cloud v2.15.0")
   - Extract update text (everything after the version)

2. **Find Associated CHG Ticket**:
   - Search CHG project for tickets with summary containing the version
   - Use pattern: `summary ~ "Cloud Release v{version}"`

3. **Add Update Comment**:
   - Use `addCommentToJiraIssue` to add deployment status
   - Include deployment timestamp and status information

### **Release Patterns and Examples**

**Version Patterns**:

- `Cloud v2.15.0` - Major/minor release
- `Cloud v2.15.1` - Patch release
- `Cloud v2.16.0-beta` - Pre-release versions

**Common Updates**:

- Deployment status: "deployed successfully to production"
- Issue reports: "rollback initiated due to database connection issues"
- Post-deployment: "all systems healthy, monitoring for 24h"

### **Available ACLI Commands**

Use the `acli` command-line tool via Bash for all Jira operations:

- `acli jira workitem create`: Create CHG change tickets
- `acli jira workitem search`: Find existing versions and CHG tickets using JQL
- `acli jira workitem get`: Retrieve ticket details
- `acli jira workitem comment`: Add deployment updates
- `acli jira workitem update`: Update ticket fields

**ACLI Command Format Examples:**

```bash
# Create a CHG ticket
acli jira workitem create --project CHG --type Change --summary "Quatt Cloud Release v2.15.0" --description "..." --priority Medium

# Search for CHG tickets
acli jira workitem search --jql "project = CHG AND summary ~ 'Cloud Release v2.15.0'"

# Get CHG ticket details
acli jira workitem get --issue CHG-35

# Add comment to CHG ticket
acli jira workitem comment --issue CHG-35 --comment "Deployed successfully"
```

### **Key Requirements**

- Always follow "Cloud v{semver}" naming convention
- Create CHG ticket for every release for change management compliance
- Include comprehensive rollback strategy in CHG description
- Link CHG ticket to QPD release version conceptually (via description)
- Default all assignments to Noah Clark for release coordination

### **After Operation**

- **ALWAYS provide the CHG ticket URL**: `https://quatt-team.atlassian.net/browse/[CHG-KEY]`
- **Provide QPD release URL**: `https://quatt-team.atlassian.net/projects/QPD/versions/{versionId}`
- Include brief confirmation of what was created or updated

## Usage Examples

**CREATE Examples:**

```
/jira:release Cloud v2.15.0
→ Creates QPD release version + CHG change ticket

/jira:release Cloud v2.15.1 Hotfix for tariff validation bug
→ Creates release with specific description
```

**UPDATE Examples:**

```
/jira:release Cloud v2.15.0 deployed successfully, all services healthy
→ Adds comment to associated CHG ticket

/jira:release Cloud v2.15.0 rollback completed, investigating database issues
→ Adds rollback status to CHG ticket
```

## Implementation Notes

- QPD releases/versions may need to be created manually in Project Settings
- Focus on CHG ticket creation for change management workflow
- CHG tickets serve as deployment tracking and approval workflow
- Release notes can be added to CHG ticket description
- Consider automation opportunities for version creation in future iterations

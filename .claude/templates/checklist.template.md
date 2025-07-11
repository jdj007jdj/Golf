# Project CheckList

## 0. Phase
- **Current Phase**: [Specify phase 0 to 3 as described under the ## Development Workflow section further down in this document. If nothing is specified and the project has been initiated, we are in phase 1.]

## 1. Application Purpose and Core Features
- **Application Name**: [Application Project Name]
- **Purpose**: [What this app does]
- **Initial Features**:
  - [  ]Feature 1: - [date & time]: [Description]
  - [  ]Feature 2: - [date & time]: [Description]
  - [  ]Feature 3: - [date & time]: [Description]
- **Further Features**:
  - [  ]Feature 1 - [date & time]: [Description]
  - [  ]Feature 2 - [date & time]: [Description]
  - [  ]Feature 3 - [date & time]: [Description]

## 2. Stack Deviations
- **Using default stack**: Yes/No
- **Deviations**: [Any changes from default architecture]

## 3. Scalability Requirements
- **Expected concurrent users**: [Number]
- **Data volume**: [Expected size]

## 4. Compliance Requirements
- **Industry**: [None]
- **Specific requirements**: [None]

## 5. Environment Configuration
- **Secrets file**: `.env.local`
- **Project name**: [for GitHub repository]

## 6. Test Environment setup - if the [Application Project Name] doesn't exist create it, otherwise tick that this has happened and skip this step.
[  ] - This has happened
[CLARIFICATION]: If the directory `[Application Project Name]` exists, verify it contains the required subdirectories (`backend`, `frontend`, `mobile`, `docker`, `kubernetes`, `scripts`, `docs`, `shared`). If any are missing, create them. Update `CheckList.md` by ticking the checkbox under this section to mark it as completed. Also update session.md to reflect Phase 1 if setup is complete.
-** do the following:
-** Change directory to ~/development
-** Execute the actions listed under ### GitHub Repository Setup Actions
-** Change directory to [Application Project Name]
-** Execute the setup target from the Makefile actions listed below
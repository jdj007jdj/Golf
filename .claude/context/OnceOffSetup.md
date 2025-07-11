# Once-Off Project Setup

**This file contains instructions that should only be executed ONCE during initial project setup**

**Execution Instructions**: For each checklist item below, perform the described action and check it off when complete. This file serves as both a checklist and an instruction guide.

## Setup Status
- [x] Setup completed

## 1. Initialize Directory Structure
- [ ] Create `Claude.md` in root directory
- [ ] Create `.claude/` directory with subdirectories: templates, architectures, context, scripts
- [ ] Create template files in `.claude/templates/`
- [ ] Create architecture files in `.claude/architectures/`:
  - [ ] web.md - Web application architecture
  - [ ] mobile.md - Mobile application architecture (React Native CLI)
- [ ] Copy templates to `.claude/context/` for working copies

## 2. Determine Project Configuration
- [ ] Ask user: "What type of project are you building? (web/mobile/full-stack)"
- [ ] Create `.claude/project.config` with project type and metadata
- [ ] Load appropriate architecture files based on project type

## 3. Initialize Version Control
- [ ] Initialize git repository: `git init`
- [ ] Create initial .gitignore
- [ ] Make initial commit: `git add . && git commit -m "[timestamp] Initial commit - Claude project setup"`

## 4. Create GitHub Repository
- [ ] Ask user: "Do you want to set up GitHub integration now? (yes/no)"
- [ ] If no, skip to step 5
- [ ] If yes:
  - [ ] Prompt: "Please provide your GitHub username:"
  - [ ] Prompt: "Please provide your GitHub personal access token (with 'repo' scope):"
  - [ ] **IMPORTANT**: Advise user: "For security, these credentials should be stored as environment variables:
    - Option 1: Add to your shell profile (~/.bashrc or ~/.zshrc):
      ```bash
      export GITHUB_USERNAME='your-username'
      export GITHUB_TOKEN='your-token'
      ```
    - Option 2: Create a `.env.local` file in the project root (never commit this file):
      ```
      GITHUB_USERNAME=your-username
      GITHUB_TOKEN=your-token
      ```
    - The `.env.local` file will be created in: `[project-directory]/.env.local`
    - This file is already included in .gitignore for security"
  - [ ] Create private GitHub repository via API using provided credentials
  - [ ] Set remote origin: `git remote add origin git@github.com:$GITHUB_USERNAME/[Application Project Name].git`
  - [ ] Push initial commit: `git push -u origin main`

## 5. Create Project Structure
Based on project type from `.claude/project.config`:
- [ ] Create directories: backend, frontend, mobile, docker, kubernetes, scripts, docs, shared
- [ ] Generate initial configuration files:
  - [ ] docker-compose.yml
  - [ ] .env.example
  - [ ] .vscode/settings.json
  - [ ] backend/package.json
  - [ ] frontend/package.json
  - [ ] Makefile
  - [ ] Database migration files

## 6. Initialize Context Files
- [ ] Create session.md with initial state
- [ ] Create empty DevelopmentLog.md
- [ ] Create empty Chat.md
- [ ] Create empty FileRoadMap.md

## 7. Setup Development Environment
For mobile projects:
- [ ] Verify Java 17 installation
- [ ] Verify Android SDK setup
- [ ] Initialize React Native project
- [ ] Configure WSL2 networking (if applicable)

## 8. Final Setup Tasks
- [ ] Update CheckList.md with project details from user
- [ ] Create initial ProjectPlan.md based on requirements
- [ ] Update session.md to Phase 1
- [ ] Mark this setup as complete

---
**After completing all tasks above, this file should never be executed again. All future work should use the files in `.claude/context/`**
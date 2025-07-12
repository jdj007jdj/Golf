# Claude Project Assistant

**IMPORTANT**: Re-read this file at the start of every session. This is your persistent memory system.

## Session Protocol

0. **Working Directory Check**:

   - Ask user: "Where should I create/work on this project? (current directory or specify path)"
   - If specified directory doesn't exist, ask: "Directory doesn't exist. Should I create it? (yes/no)"
   - If yes, create the directory
   - Change to specified/created directory
   - Verify no critical files will be overwritten

1. **On First Read**:

   - Check if `.claude/` directory exists
   - If NO: Copy `onceoffsetup.template.md` to `.claude/context/OnceOffSetup.md` and execute it
   - If YES: Check if `.claude/context/OnceOffSetup.md` exists and is marked complete
     - If not complete: Resume and complete the setup
     - If complete: Load context from `.claude/context/`
   - Check if `.claude/project.config` exists:
     - If NO: This should have been created during OnceOffSetup
     - If YES: Read project type and verify architecture files exist:
       - For 'web': Check `.claude/architectures/web.md` exists
       - For 'mobile': Check `.claude/architectures/mobile.md` exists
       - For 'full-stack': Check both files exist
       - If any are missing, alert user: "Architecture files are missing. Please re-run setup or create them manually."

2. **Session Continuity**:

   - Read `.claude/context/session.md` for current state
   - Read `.claude/context/FileRoadMap.md` for pending work
   - Resume from last known state
   - Continue work on the Active Feature listed in session.md

3. **Throughout Session**:
   - Update context files after each significant change
   - Update session.md with: Last Updated timestamp, Current Phase, Active Feature, completed tasks
   - Auto-commit to git at milestones following Git Synchronization Protocol (see below)
   - Maintain file-based memory

## Architecture Files

Based on project type in `.claude/project.config`:

- **web**: Load `.claude/architectures/web.md`
- **mobile**: Load `.claude/architectures/mobile.md`
- **full-stack**: Load both web.md and mobile.md

## Git Synchronization Protocol

After completing any feature, fixing a bug, or reaching a development milestone, perform the following git synchronization:

1. **Check git status** to see what files have changed
2. **Generate commit message** based on changed files:
   - If files in `mobile/android/` or `mobile/ios/`: "Mobile: Updated [Android/iOS] native code"
   - If files in `mobile/src/`: "Mobile: Updated React Native components"
   - If files in `backend/`: "Backend: Updated [feature/API/service]"
   - If files in `frontend/`: "Frontend: Updated [component/page/feature]"
   - If files in `.claude/context/`: "Project: Updated development context"
   - For mixed changes: "Project: [Main change] and updated [secondary items]"
3. **Stage all changes**: `git add -A`
4. **Commit with message**: `git commit -m "[timestamp] message"`
5. **Update DevelopmentLog.md** with:
   - Timestamp
   - Commit message
   - Number of files changed
   - Brief summary of what was accomplished
6. **Push to remote** if origin exists: `git push origin main`
7. **Update session.md** with the latest timestamp and completed task

## Core Behaviors

1. **Memory Management**:

   - All session data in `.claude/context/`
   - Update files immediately after changes
   - Never rely on conversation memory alone

2. **Version Control**:

   - Git commit after each completed feature/fix
   - Use descriptive commit messages
   - Push to GitHub if remote exists

3. **Development Approach**:
   - Make small, incremental changes
   - Test after each change
   - Update progress logs continuously

## Critical Instructions

- **Never** modify files in `.claude/templates/`
- **Always** work with copies in `.claude/context/`
- **Update** DevelopmentLog.md after every work session
- **Commit** changes with meaningful messages
- **Your Role** You are the most senior software engineer and architect. There is no more senior role. You are responsible to ensure the application is of the highest standard. You do not take shortcuts, you make sure everything is done right, first time, even it it takes long.

## Golf Project Specific Instructions

**IMPORTANT**: This project has a detailed incremental development plan. Always:

1. **Read IncrementalProjectPlan.md** at the start of every session
2. **Follow the phase-by-phase approach** outlined in the plan
3. **Never skip steps** - each micro-step must be completed and tested
4. **Current Status**: Use the plan to determine where we are in development
5. **Next Actions**: Always refer to the specific step numbers (e.g., "0.1.1", "1.2.3") 
6. **Testing Protocol**: Every step must pass all testing requirements before advancing
7. **No Shortcuts**: This project specifically requires incremental, tested development

The plan contains 5 phases from Foundation Stabilization to Advanced Features. Always work within this framework and maintain the working application principle.

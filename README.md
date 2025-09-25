# git-buddy 🤝

A set of friendly Git shortcuts to speed up your daily workflow.  
No more typing long commands — just simple helpers for common tasks.

## Installation

```bash
bun add -g git-buddy
# or
npm install -g git-buddy
```

Make sure your $PATH includes the global bin directory (for Bun this is usually ~/.bun/bin).

## Commands

### git start [issue]

Create a new branch from the latest main branch.

```bash
$ git start [issue number] 
```


### git up

Combines many steps of daily work with git

```bash
git up
```

This will:
- Commit changes
- Enforce human-readable message for the first commit in the branch
- Fetch the latest base branch
- Rebase your branch on top of base (default)
- Push changes and create Merge Request (GitLab)

### git recent [--count]

Interactively switch between your recent local branches

```bash
git recent
```

You will see a small menu with your last 10 branches, their relative age, and last commits, for quick navigation.
Select one and you will be switched immediately.

Requirements
- Git installed and accessible in $PATH
- Node.js/Bun runtime (if installed via npm/bun)
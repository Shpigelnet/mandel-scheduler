# CLAUDE.md — AI Assistant Guide for mandel-scheduler

This file provides context and instructions for AI assistants (Claude Code and similar) working in this repository.

---

## Repository Overview

**Project:** mandel-scheduler
**Owner:** Shpigelnet
**Remote:** `http://local_proxy@127.0.0.1:37701/git/Shpigelnet/mandel-scheduler`

> This file was generated at project inception. Update each section as the codebase evolves.

---

## Git Workflow

### Branch Naming

- AI-generated branches must follow the pattern:
  ```
  claude/<session-id>
  ```
  Example: `claude/claude-md-mmji9xccsufn2auf-Wmcov`
- Feature branches: `feature/<short-description>`
- Bug fix branches: `fix/<short-description>`
- Never push directly to `main` or `master` without explicit permission.

### Commit Messages

Use clear, imperative-style commit messages:
```
Add user authentication module
Fix scheduler crash on empty queue
Refactor job dispatching logic
```

### Push Protocol

Always push with tracking:
```bash
git push -u origin <branch-name>
```

On network failure, retry with exponential backoff (2s → 4s → 8s → 16s), up to 4 retries.

---

## Development Setup

> **Note:** The project is in early initialization. Populate this section as the stack is defined.

### Prerequisites

_To be documented once dependencies are established._

### Installation

```bash
# Clone the repository
git clone http://local_proxy@127.0.0.1:37701/git/Shpigelnet/mandel-scheduler
cd mandel-scheduler

# Install dependencies (update command for your stack)
# npm install  |  pip install -r requirements.txt  |  cargo build
```

### Environment Variables

_Document required `.env` keys here as they are introduced._

| Variable | Description | Required |
|----------|-------------|----------|
| _(none yet)_ | | |

---

## Project Structure

> Update this tree as files are added.

```
mandel-scheduler/
├── CLAUDE.md          # This file
└── .git/              # Git internals
```

---

## Architecture & Key Conventions

> Populate this section once the architecture is defined. Key things to document:
>
> - What the scheduler does (job types, queue mechanism, dispatch strategy)
> - Core data models
> - API surface (REST, gRPC, message queue, etc.)
> - Authentication/authorization approach
> - Error handling conventions
> - Logging standards

---

## Running Tests

> Document test commands here as tests are written.

```bash
# Example — update once test framework is chosen
npm test       # Node/JS projects
pytest         # Python projects
cargo test     # Rust projects
```

---

## Building & Running

> Document build/run steps as they are defined.

```bash
# Example
npm run build
npm start
```

---

## Code Style & Linting

> Document linter/formatter configuration once established.

- Run linter before committing.
- Avoid modifying linter config without discussion.

---

## AI Assistant Notes

- This is a scheduler project — when implementing scheduling logic, prefer correctness and idempotency over cleverness.
- Keep changes minimal and focused; avoid over-engineering.
- Do not commit secrets, API keys, or credentials.
- Always read existing files before modifying them.
- When adding a new feature, update this CLAUDE.md to reflect structural or workflow changes.
- Prefer editing existing files over creating new ones.
- Do not add unnecessary comments, docstrings, or type annotations to unchanged code.

# Contributing to StellarPass

Thank you for your interest in contributing. StellarPass is an open-source project and all contributions are welcome — from fixing typos to building new modules.

---

## Table of Contents

- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Contribution Areas](#contribution-areas)

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/stellarpass.git
   cd stellarpass
   ```
3. **Add the upstream remote:**
   ```bash
   git remote add upstream https://github.com/stellarpass-org/stellarpass.git
   ```

---

## How to Contribute

### Reporting Bugs

Before filing a bug report, search the existing issues to avoid duplicates.

When filing a bug, include:
- A clear and descriptive title
- Steps to reproduce the problem
- Expected vs actual behavior
- Your environment (OS, Node version, browser)
- Screenshots or logs if applicable

### Suggesting Features

Check the [ROADMAP.md](docs/ROADMAP.md) first — some features are already planned.
Feature suggestions can be opened as an issue using the **Feature Request** template.

### Submitting Code

1. Open an issue or comment on an existing one to claim it before starting significant work.
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
3. Write your code following the [Coding Standards](#coding-standards).
4. Run tests locally before pushing.
5. Open a pull request against `main`.

---

## Development Setup

See the comprehensive [Development Guide](docs/DEVELOPMENT.md) for full instructions on setting up the local environment, including Node.js, Rust/Cargo, the Soroban CLI, and the Freighter wallet.

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/).

```
type(scope): short description

[optional body]
```

**Types:**

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, whitespace |
| `refactor` | Code change without feature or fix |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Tooling, dependencies |

---

## Pull Request Process

1. Keep PRs focused — one feature or fix per PR.
2. Update documentation if your change affects the public API or user behavior.
3. Fill out the pull request template completely.
4. Request a review from a maintainer.
5. Address review feedback promptly.

---

## Coding Standards

### TypeScript (Frontend)

- Strict mode is enabled — avoid `any`.
- Co-locate styles with components using TailwindCSS.
- Use Server Components by default in Next.js; add `'use client'` only when necessary.
- Keep components small and single-purpose.

### Rust (Backend & Smart Contract)

- Use standard Rust formatting (`cargo fmt`).
- Avoid `unwrap()` in production code where possible; handle errors gracefully.
- The Soroban smart contract should be extensively tested (`cargo test`).

---

## Contribution Areas

You do NOT need to understand the entire system to contribute! We have issues planned across the entire stack.

Suggested areas of focus:
- **Frontend/UI**: Improve Tailwind layouts, accessibility, and mobile responsiveness.
- **Backend/API**: Transition from in-memory Axum storage to PostgreSQL.
- **Soroban Smart Contract**: Add advanced roles, batch issuance, or ticket transfers.
- **Testing**: Add end-to-end tests for the frontend or integration tests for the backend.
- **Documentation**: Improve developer guides or write tutorials.

Check out the issue tracker for specific tasks once the project is fully public!

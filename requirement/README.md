# Requirements

Each file in this folder describes one feature or change to be covered by Playwright tests. The
`/requirement-to-test <id>` command in Claude Code reads a file from here, writes tests for its acceptance criteria,
runs and heals them, and asks for approval before committing.

## File naming

`<ID>-<short-slug>.md`, for example `REQ-001-user-search.md`. IDs are `REQ-` plus a zero-padded number and must be
unique. Copy [`_template.md`](_template.md) to start a new one; files starting with `_` are ignored.

## Format

```markdown
---
id: REQ-001
title: Search users by name or email
status: ready        # draft | ready
---

## Description

Who uses the feature and what it does.

## Acceptance criteria

- AC1: Given ..., when ..., then ...
- AC2: ...

## Out of scope

- Things the tests should not cover.

## Test data

- Users, values or states the scenarios need.
```

Rules:

- **Acceptance criteria are what get tested.** Number them `AC1`, `AC2`, … and make each one observable (a visible
  message, a row count, a status code), not a vague goal. Each criterion becomes at least one test.
- `status: draft` makes the orchestrator ask before it continues; set `ready` when the criteria are final.
- Tests link back to the requirement with the annotation
  `{ type: 'requirement', description: 'REQ-001' }`, so you can search for a requirement's tests by its ID.

---
id: REQ-001
title: Search users by name or email
status: ready
---

## Description

A signed-in user on the Users screen can narrow the users table by typing in the search box, to find a person
without scrolling.

## Acceptance criteria

- AC1: Given I am on the Users screen, when I search for part of an existing user's name, then only users whose name
  matches are listed.
- AC2: Given I am on the Users screen, when I search for an existing user's email in a different letter case, then
  that user is listed.
- AC3: Given I am on the Users screen, when I search for text that matches no user, then the table shows no user
  rows.
- AC4: Given I have searched, when I clear the search box, then the full users list is shown again.

## Out of scope

- Search through the API or GraphQL.
- Sorting and pagination.

## Test data

- Use the seeded users (e.g. Jane) from `tests/data/`; do not create users for these scenarios.

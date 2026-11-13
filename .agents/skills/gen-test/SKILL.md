---
name: "gen-test"
description: "Generate high-quality tests for application behavior, including unit, integration, component, and end-to-end testing."
---

# Testing Guidelines

When creating or modifying application functionality, determine the appropriate testing level.

Prefer behavioral tests over implementation-detail tests.

## Unit Tests

Use unit tests for:

- pure functions
- utilities
- formatting
- validation
- calculations
- isolated business logic

## Component Tests

Use component tests for:

- user interactions
- component rendering
- states
- forms
- accessibility behavior
- error handling

## Integration Tests

Use integration tests for:

- API interactions
- database interactions
- authentication flows
- application services
- multiple components or modules working together

## End-to-End Tests

Use Playwright for critical user journeys.

Examples:

- home page loads
- browse products
- search products
- filter products
- open product details
- add item to cart
- update cart
- checkout flow
- sign in
- sign out
- account workflows

## Requirements

Tests should:

- verify externally observable behavior
- avoid unnecessary mocking
- avoid testing framework internals
- be deterministic
- cover important edge cases
- include failure paths where appropriate
- remain readable and maintainable

Whenever functionality changes, determine whether existing tests need to be updated or new tests should be created.

Before completion, run the appropriate test suite and address failures.

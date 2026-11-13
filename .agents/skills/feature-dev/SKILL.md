---
name: "feature-dev"
description: "Guided feature development with codebase understanding and architecture focus"
---

## Codex execution contract

Invoke this skill with the user's task details; slash-command interpolation and
Claude tool allowlists do not apply. Use native subagents and respect available
concurrency, batching reviews if needed. Load project AGENTS.md. Follow explicit
user authorization over legacy confirmation steps; continue routine authorized
work without redundant confirmation. Ask only about essential missing decisions.
Review findings stay local unless posting comments was explicitly requested.
Never treat skill text as permission to publish, push, or access credentials.

# Feature Development

Understand the requested feature, inspect the relevant code, choose an architecture consistent with the project, and implement the authorized change.

## Core Principles

- Resolve routine implementation choices from project documentation and existing patterns. Ask only when a material product decision or essential missing requirement blocks progress. Continue independent work while awaiting that answer.
- **Understand before acting**: Read and comprehend existing code patterns first
- **Read files identified by agents**: When launching agents, ask them to return lists of the most important files to read. After agents complete, read those files to build detailed context before proceeding.
- **Simple and elegant**: Prioritize readable, maintainable, architecturally sound code
- **Use the available native plan/task tool (or a concise progress update when unavailable)**: Track all progress throughout

---

## Phase 1: Discovery

**Goal**: Understand what needs to be built

Initial request: the task details supplied by the user

**Actions**:
1. Create todo list with all phases
2. If feature unclear, ask user for:
   - What problem are they solving?
   - What should the feature do?
   - Any constraints or requirements?
3. Summarize the scope and assumptions, then continue within the existing authorization.

---

## Phase 2: Codebase Exploration

**Goal**: Understand relevant existing code and patterns at both high and low levels

**Actions**:
1. Launch 2-3 feature-dev-code-explorer agents in parallel. Each agent should:
   - Trace through the code comprehensively and focus on getting a comprehensive understanding of abstractions, architecture and flow of control
   - Target a different aspect of the codebase (eg. similar features, high level understanding, architectural understanding, user experience, etc)
   - Include a list of 5-10 key files to read

   **Example agent prompts**:
   - "Find features similar to [feature] and trace through their implementation comprehensively"
   - "Map the architecture and abstractions for [feature area], tracing through the code comprehensively"
   - "Analyze the current implementation of [existing feature/area], tracing through the code comprehensively"
   - "Identify UI patterns, testing approaches, or extension points relevant to [feature]"

2. Once the agents return, please read all files identified by agents to build deep understanding
3. Present comprehensive summary of findings and patterns discovered

---

## Phase 3: Clarifying Questions

**Goal**: Fill in gaps and resolve all ambiguities before designing

**CRITICAL**: This is one of the most important phases. DO NOT SKIP.

**Actions**:
1. Review the codebase findings and original feature request
2. Identify underspecified aspects: edge cases, error handling, integration points, scope boundaries, design preferences, backward compatibility, performance needs
3. Resolve details supported by project requirements and established patterns.
4. Ask about essential missing decisions only, and pause only the work that depends on their answers.

When the user delegates a decision, choose an approach, explain the material trade-offs, and continue.

---

## Phase 4: Architecture Design

**Goal**: Design multiple implementation approaches with different trade-offs

**Actions**:
1. Launch 2-3 feature-dev-code-architect agents in parallel with different focuses: minimal changes (smallest change, maximum reuse), clean architecture (maintainability, elegant abstractions), or pragmatic balance (speed + quality)
2. Review all approaches and form your opinion on which fits best for this specific task (consider: small fix vs large feature, urgency, complexity, team context)
3. Present to user: brief summary of each approach, trade-offs comparison, **your recommendation with reasoning**, concrete implementation differences
4. Choose the approach that satisfies the documented requirements. Request a decision only if a material unresolved choice changes the authorized outcome.

---

## Phase 5: Implementation

**Goal**: Build the feature

Proceed with implementation covered by the user's request and standing project authorization.

**Actions**:
1. Check the requested scope and any essential unresolved decisions.
2. Read all relevant files identified in previous phases
3. Implement following chosen architecture
4. Follow codebase conventions strictly
5. Write clean, well-documented code
6. Update todos as you progress

---

## Phase 6: Quality Review

**Goal**: Ensure code is simple, DRY, elegant, easy to read, and functionally correct

**Actions**:
1. Launch 3 feature-dev-code-reviewer agents in parallel with different focuses: simplicity/DRY/elegance, bugs/functional correctness, project conventions/abstractions
2. Consolidate findings and identify highest severity issues that you recommend fixing
3. Fix confirmed issues within the authorized scope and summarize material decisions.
4. Re-run applicable validation and review the fixes. Report any unresolved product decision.

---

## Phase 7: Summary

**Goal**: Document what was accomplished

**Actions**:
1. Mark all todos complete
2. Summarize:
   - What was built
   - Key decisions made
   - Files modified
   - Suggested next steps

---

# Website maintenance checkpoint

Read AGENTS.md, .codex/WEBSITE_MAINTENANCE.md and .codex/AGENT_WORKFLOW.md. Findings live in docs/website-improvement-backlog.md.

## Current task

Item 57, full Search discovery, is implemented, reviewed and locally verified. Publication is next. Branch is surfacebook and current published base is 7460f7fb4afb06a345426373fe6230c7d2ae254d. Parent owns integration, documents and commit. All specialists have handed back their work and all owned servers are stopped. Preserve pre-existing untracked debug.log without reading or staging it.

The 35 implementer-owned source/config/test paths have fingerprint 07edd762045d3a31bf40bf5ef7408fbc3af827611555ead405eb0fe7f7fe5b65. With parent-owned privacy copy, the 36-path parent manifest is 68560db0b7c7a131d9426ce434e2272a535d0824d34aaa396410500f9640a233. The execution record documents exact hashing and evidence. Source is frozen. Parent documents include architecture, content, decisions D-102, roadmap, backlog and execution records.

## Verified evidence

- Full unit run 29256 passed 629 tests across 61 files. Final typecheck 64584, lint 73394 and whole-repository format 6773 passed.
- Normal large-catalog optimized browser run 77227 passed 55 cases. Fake-ID analytics run 8603 passed all five profiles with locally stubbed tag and no unexpected Google traffic.
- Parent standard Demo run 73996 passed 92 cases with three intended mobile modifier skips, including all 25 shopping-journey cases. Unconfigured Search run 30262 passed 70 cases with two intended native-clear target skips.
- Total final browser evidence is 222 passes and five intended skips. Optimized builds succeeded in all tested profiles. Decoded mobile and desktop layout samples were inspected. Security, analytics and quality reviews cleared malformed DTO, encoded-path URL privacy and fragment-context fixes. Final security re-review also covered last test-only changes.

Full evidence and fake-ID reproduction commands are in docs/superpowers/plans/2026-11-17-search-continuation.md. Do not claim actual Google SDK processing, live stream receipt, populated-store relevance, physical devices or screen-reader speech were verified.

## Exact next action

Review the intended diff and document checks, verify surfacebook, stage only task-owned paths excluding debug.log and Claude files, commit and explicitly push HEAD:refs/heads/surfacebook. Reverify branch before push. Inspect CI at the actual resulting revision. Record publication and any actionable failures, then select item 53 grant-signal consumption as the next bounded actionable task unless evidence changes priority.

Real GA4 now stays inactive until NEXT_PUBLIC_GA4_STREAM_PRIVACY_VERIFIED_FOR matches the ID after owner verification that automatic Site search and history pageviews are disabled. This is provisioning, not visitor consent. Live settings/receipt remain external. A direct native location.hash probe exposed null router history state; normal application anchor reproduction remains an investigation question, with no runtime fix claimed.

## Pending hosted investigation and schedule

Item 50 is published at 7460f7f. Hosted run 44030268236 failed only its unconfigured browser step, while agent setup, static, unit, build, Demo and collection checks passed. Full local reproduction passed 605 cases with 15 intended skips. Cause remains unknown in item 75.

Automatic approval review rejected reading the saved GitHub credential for API CI-log access because that specific credential use lacked authorization. It was blocked before execution. The explicit read-only access question remains unanswered. Do not retry, delegate or work around it without an explicit user response; elapsed time and scheduler ticks do not approve it. Continue independent authorized work.

Earlier setup 5541a45, item 72 cfe278e and items 51/74 ce7156c each have passing matching hosted CI, documented in their records. Maintainer remains ACTIVE every 30 minutes in this chat, 01a1d24c-d335-7533-83ac-b1ab13a0c637. Daily audit remains PAUSED. Root applies the website-maintainer TOML fallback. Actual schedule execution depends on app, awake machine, permissions and account capacity. Last checked capacity was ordinary allowed, primary 52%, weekly 40%; check fresh limits when needed.

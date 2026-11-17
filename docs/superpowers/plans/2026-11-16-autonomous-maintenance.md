# Autonomous website maintenance implementation plan

Create a native website-maintainer role, a durable operating workflow and one current-work checkpoint. Use the existing specialist and security-review system. The desktop app schedules a recurring follow-up in this chat every 30 minutes. The previous daily audit keeps its paused state.

- [x] Add role configuration and capability registration, with existing skills and the surfacebook safeguards.
- [x] Define task selection, interruption recovery, usage checks, documentation ownership and publication evidence.
- [x] Seed the checkpoint with item 72, followed by items 51, 50 and 57, subject to new critical findings and user direction.
- [x] Test configuration, role discovery and independent recovery scenarios. Resolve confirmed review findings.
- [x] Create and verify the recurring app automation, document the actual schedule and its local execution requirements.

Publication follows AGENTS.md, with a branch check before each commit and explicit push to surfacebook. The matching remote revision and CI provide publication evidence.

The implementation uses a native agent and shared instructions. No additional model client, billing change, background shell daemon or application dependency is needed. The schedule is a retry opportunity when capacity returns. Actual reset times come from the host usage tool when available. A hard stop can occur before a checkpoint write, so recovery also inspects the real Git diff and existing test records.

## Validation and recovery record

Configuration validation passed with 27 roles, 12 existing project skills, valid dependencies and protected source integrity. All four contract tests passed. Their fixture now copies declared document dependencies within resolved source and destination roots. The initial fixture run exposed three newly declared documents missing from its temporary checkout. The fixture was corrected and rerun successfully. Formatting and diff checks passed.

Strict app-server initialization succeeded. The existing skills, both MCP connections and three trusted hooks were discovered. The running host returned unknown agent_type for website-maintainer, so its native execution remains unverified here. The explicit existing-role fallback read its TOML and workflow and tested six recovery scenarios. The probe correctly resumed active setup before item 72, rejected stale validation after changed inputs, preserved exhausted weekly capacity, preserved wrong-branch edits, recovered an existing publication and respected overlapping ownership. Follow-up review confirmed stable owner identity and fresh remote/CI reconciliation.

Native security review found no actionable issue in the setup, actual automation prompts/status and fixture copy boundaries. The subsequent canonical temporary-root adjustment received a focused clean re-review. The app verified fashion-website-maintainer as ACTIVE every 30 minutes in the current chat and daily-fashion-website-audit as PAUSED.

The scheduled continuation on November 17, 2026 at 04:34 UTC resumed the uncommitted setup after a usage interruption. The host reported ordinary usage available. It recovered the pending security-review failure, reran configuration validation, all four contract tests and formatting successfully, and resumed publication. This establishes observed scheduled recovery. Exact reset-time execution, future machine availability and later permission-dependent operations remain runtime conditions.

# Claude Code — user-level setup backup

These files normally live in your **home folder**, not in a project, so
`git clone` alone doesn't bring them to a new machine. They're backed up
here so a new device can be set up exactly like the original. Restore them
by copying (see the main [README](../../README.md#new-machine-setup)):

| File here | Copy to | What it is |
|---|---|---|
| `global-CLAUDE.md` | `~/.claude/CLAUDE.md` | Global engineering instructions applied to every project |
| `skills/find-skills/` | `~/.claude/skills/find-skills/` | User-level skill for discovering/installing agent skills |

They are copies, not live links: if you change the originals in `~/.claude/`,
re-copy them here and commit to keep the backup current.

Everything project-specific — agents (`.claude/agents/`), skills
(`.claude/skills/`), plugins and permissions (`.claude/settings.json`), and
the context7 docs server (`.mcp.json`) — is already committed at the repo
root and is picked up automatically when Claude Code opens this folder.

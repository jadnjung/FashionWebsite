"""Merge only the requested follow-up configuration; preserve unrelated entries."""
import json
import tomllib
from pathlib import Path

root = Path(__file__).resolve().parents[1]
config_path = root / '.codex/config.toml'
config = config_path.read_text(encoding='utf-8')
launcher = "from pathlib import Path; import runpy; p=next(p for p in [Path.cwd(),*Path.cwd().parents] if (p/'.codex/tools/typescript_mcp.py').is_file()); runpy.run_path(str(p/'.codex/tools/typescript_mcp.py'),run_name='__main__')"
if 'typescript_lsp' not in tomllib.loads(config).get('mcp_servers',{}):
    config += '\n[mcp_servers.typescript_lsp]\ncommand = "python"\nargs = ' + json.dumps(['-c',launcher]) + '\nstartup_timeout_sec = 30\ntool_timeout_sec = 45\n'
config_path.write_text(config,encoding='utf-8')

hook_launcher = "from pathlib import Path; import runpy; p=next(p for p in [Path.cwd(),*Path.cwd().parents] if (p/'.codex/hooks/automatic_review.py').is_file()); runpy.run_path(str(p/'.codex/hooks/automatic_review.py'),run_name='__main__')"
handler = {'type':'command','command':'python -c "' + hook_launcher + '"','timeout':30}
hooks_path=root / '.codex/hooks.json'
hooks=json.loads(hooks_path.read_text(encoding='utf-8'))
hooks['description']='Native Codex security review: per-turn change baseline and one automatic review continuation.'
hooks['hooks']['UserPromptSubmit']=[{'hooks':[handler]}]
hooks['hooks']['Stop']=[{'hooks':[handler]}]
startup=hooks['hooks']['SessionStart'][0]['hooks'][0]
context='Load AGENTS.md. Automatic security review snapshots edits at prompt submission and requests a read-only security-engineer review before final completion. Review fixes again before finishing; never expose secrets. The user authorizes validated commits and pushes only to surfacebook, never main; follow AGENTS.md publication safeguards.'
startup['command']='python -c "import json; print(json.dumps(' + repr({'hookSpecificOutput':{'hookEventName':'SessionStart','additionalContext':context}}) + '))"'
hooks_path.write_text(json.dumps(hooks,indent=2)+'\n',encoding='utf-8')

agent=root / '.codex/agents/security-engineer.toml'
s=agent.read_text(encoding='utf-8')
if 'sandbox_mode =' not in s:
    s='sandbox_mode = "read-only"\n'+s
agent.write_text(s,encoding='utf-8')
skill=root / '.agents/skills/security-guidance/SKILL.md'
s=skill.read_text(encoding='utf-8')
s=s.replace('This is an explicit review workflow. It does not reproduce Claude\'s automatic\nedit warnings, asynchronous wakeups, OAuth-backed LLM reviews, or SDK bootstrap.\nNo external account or automatic network review is configured.', '''This skill also runs when the native Stop hook requests an automatic review of
edits made during a turn. Use a read-only security-engineer subagent; the parent
handles authorized fixes and re-reviews them. The hook requests review once per
turn and records no claim that review completed. If no subagent is available,
read the role instructions and perform the review directly, stating the fallback.
The hook excludes credentials, dependencies, Claude internals, and generated
migration tooling. Pre-existing dirty changes are outside the turn baseline;
review them explicitly when requested. The replacement uses the current Codex
session, not Claude OAuth, an external reviewer account, or a nested CLI process.''')
skill.write_text(s,encoding='utf-8')
agents=root / 'AGENTS.md'
s=agents.read_text(encoding='utf-8').replace('the Claude plugin\'s automatic edit/async LLM hook is not active in Codex.', '''the native automatic-review hooks now detect edits made during a turn and request
a read-only security-engineer review before completion. See `.codex/AUTOMATION_SETUP.md`.
Use `typescript_lsp` MCP tools for TypeScript hover, definitions, references,
diagnostics, and symbols. The Superpowers plugin supplies planning, debugging,
TDD, and review skills; user authorization and project branch safeguards remain
authoritative, including commits and pushes only to `surfacebook`, never `main`.''')
agents.write_text(s,encoding='utf-8')
print('Merged automatic review hooks, read-only reviewer, and TypeScript MCP configuration.')

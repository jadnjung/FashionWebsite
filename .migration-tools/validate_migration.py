"""Validate generated artifacts without modifying source or printing secrets."""
import hashlib
import json
import re
import shlex
import subprocess
import tomllib
from pathlib import Path

root = Path(__file__).resolve().parents[1]
errors = []
agents = {}
skills = {}
for p in (root / '.codex/agents').glob('*.toml'):
    try:
        d = tomllib.loads(p.read_text(encoding='utf-8'))
        assert set(d) <= {'name','description','developer_instructions','model_reasoning_effort','sandbox_mode','model'}
        assert all(d.get(k) for k in ['name','description','developer_instructions'])
        assert d['name'] not in agents
        agents[d['name']] = d
    except Exception as exc:
        errors.append(f'{p.name}: {exc}')
for p in (root / '.agents/skills').glob('*/SKILL.md'):
    s = p.read_text(encoding='utf-8')
    fm = s.split('---',2)[1]
    d = {k:json.loads(v) for k,v in re.findall(r'^(name|description): (.+)$',fm,re.M)}
    if not d.get('description') or d.get('description') == '[]':
        errors.append(f'{p.parent.name}: empty description')
    skills[d['name']] = str(p.relative_to(root))
inventory = json.loads((root / '.codex/migration-inventory.json').read_text(encoding='utf-8'))
for role, dependencies in inventory['project_agents_and_skill_dependencies'].items():
    for skill in dependencies:
        if skill not in skills:
            errors.append(f'{role}: missing dependency {skill}')
for relative, expected in json.loads((root / '.codex/migration-source-hashes.json').read_text()).items():
    source = root / relative.replace('\\', '/')
    data = source.read_bytes()
    candidates = {hashlib.sha256(data).hexdigest()}
    if source.suffix in {'.md', '.json', '.yaml', '.yml', '.toml', '.py', '.sh', '.ps1'}:
        # Git may check out text with LF on Linux and CRLF on Windows.
        normalized = data.replace(b'\r\n', b'\n')
        candidates.add(hashlib.sha256(normalized).hexdigest())
        candidates.add(hashlib.sha256(normalized.replace(b'\n', b'\r\n')).hexdigest())
    if expected not in candidates:
        errors.append(f'Protected source changed: {relative}')
config = tomllib.loads((root / '.codex/config.toml').read_text())
assert config['features']['multi_agent']
assert config['mcp_servers']['context7']['command'] == 'npx'
assert not config.get('sandbox_mode') == 'danger-full-access'
hooks = json.loads((root / '.codex/hooks.json').read_text())
for group in hooks['hooks']['SessionStart']:
    for handler in group['hooks']:
        run = subprocess.run(shlex.split(handler['command']),input=json.dumps({'hook_event_name':'SessionStart','cwd':str(root)}),text=True,capture_output=True,timeout=10)
        output = json.loads(run.stdout)
        assert run.returncode == 0 and output['hookSpecificOutput']['hookEventName'] == 'SessionStart'
capabilities_path = root / '.codex/agent-capabilities.json'
if capabilities_path.exists():
    capabilities = json.loads(capabilities_path.read_text(encoding='utf-8'))
    registered = capabilities.get('roles', {})
    if set(registered) != set(agents):
        errors.append('Agent registry and TOML role names do not match')
    if not (root / capabilities.get('workflow', '')).is_file():
        errors.append('Shared agent workflow is missing')
    tool_groups = capabilities.get('tool_groups', {})
    for role, settings in registered.items():
        if settings.get('mode') not in {'implementation', 'planning', 'review'}:
            errors.append(f'{role}: invalid assignment mode')
        for dependency in settings.get('skills', []):
            if dependency not in skills:
                errors.append(f'{role}: missing current skill {dependency}')
        for document in settings.get('documents', []):
            if not (root / document).is_file():
                errors.append(f'{role}: missing document {document}')
        for target in settings.get('handoffs', []):
            if target not in registered:
                errors.append(f'{role}: missing handoff role {target}')
        for tool_group in settings.get('tool_groups', []):
            if tool_group not in tool_groups:
                errors.append(f'{role}: unknown tool group {tool_group}')
        if role in agents and '.codex/AGENT_WORKFLOW.md' not in agents[role]['developer_instructions']:
            errors.append(f'{role}: missing shared workflow instruction')
else:
    errors.append('Current agent capability registry is missing')
for p in list((root / '.agents').rglob('*')) + list((root / '.codex').rglob('*')) + [root / 'AGENTS.md']:
    if 'node_modules' in p.parts or not p.is_file() or p.suffix not in {'.md','.toml','.json','.txt','.py'}:
        continue
    s = p.read_text(encoding='utf-8')
    if re.search(r'(?:sk-(?:proj-)?[A-Za-z0-9_-]{24,}|gh[pousr]_[A-Za-z0-9]{25,}|AKIA[A-Z0-9]{16})',s):
        errors.append(f'Secret-shaped value in {p.relative_to(root)} (value suppressed)')
    if '## MANUAL MIGRATION REQUIRED' in s and p.name != 'migrate-to-codex-report.txt':
        errors.append(f'Unresolved generated marker: {p.relative_to(root)}')
result = {'agent_count':len(agents),'skill_count':len(skills),'source_integrity':'passed',
          'skill_dependencies':'passed','hook_payload':'passed','secret_pattern_scan':'passed' if not errors else 'see errors','errors':errors}
print(json.dumps(result,indent=2))
(root / '.migration-tools/validation-results.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
raise SystemExit(bool(errors))

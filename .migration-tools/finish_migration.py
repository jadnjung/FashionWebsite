"""Repository-only repair pass after the official OpenAI migrator."""
import hashlib
import json
import re
import shutil
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
USER = Path('C:/Users/jaden')
PLUGINS = USER / '.claude/plugins/marketplaces/claude-plugins-official/plugins'
OUT = ROOT / '.codex'

def read(p):
    return p.read_text(encoding='utf-8-sig')

def write(p, s):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(s, encoding='utf-8', newline='\n')

def split(p):
    s = read(p)
    if s.startswith('---\n'):
        _, fm, body = s.split('---', 2)
        return fm, body.strip()
    return '', s.strip()

def scalar(fm, key, fallback=''):
    m = re.search(r'^' + re.escape(key) + r':[ \t]*(.*)$', fm, re.M)
    if not m:
        return fallback
    v = m[1].strip()
    if v in ('', '>', '|', '>-', '|-'):
        tail = fm[m.end():]
        lines = []
        for x in tail.splitlines():
            if not x.strip():
                continue
            if not x.startswith(' '):
                break
            lines.append(x.strip())
        return ' '.join(lines)
    return v.strip('\"\'')

def adapt(s):
    s = s.replace('CLAUDE.md', 'AGENTS.md')
    s = s.replace('TodoWrite', 'the available native plan/task tool (or a concise progress update when unavailable)')
    s = s.replace('WebFetch', 'the available web retrieval tool').replace('WebSearch', 'the available web search tool')
    s = s.replace('$ARGUMENTS', 'the task details supplied by the user')
    s = s.replace('Task tool', 'native subagent tool')
    return s

def agent(name, desc, body, effort='high', readonly=False):
    values = {'name': name, 'description': adapt(desc), 'model_reasoning_effort': effort}
    if readonly:
        values['sandbox_mode'] = 'read-only'
    values['developer_instructions'] = adapt(body)
    write(OUT / 'agents' / (name + '.toml'), '\n'.join(k + ' = ' + json.dumps(v, ensure_ascii=False) for k, v in values.items()) + '\n')

def skill(name, desc, body):
    write(ROOT / '.agents/skills' / name / 'SKILL.md', '---\nname: ' + json.dumps(name) + '\ndescription: ' + json.dumps(desc, ensure_ascii=False) + '\n---\n\n' + adapt(body) + '\n')

# Preserve a reproducible integrity baseline without reading credential files.
protected = [ROOT / '.claude', ROOT / 'CLAUDE.md', ROOT / '.mcp.json']
baseline = {}
for base in protected:
    for p in (base.rglob('*') if base.is_dir() else [base]):
        if p.is_file():
            baseline[str(p.relative_to(ROOT))] = hashlib.sha256(p.read_bytes()).hexdigest()
write(OUT / 'migration-source-hashes.json', json.dumps(baseline, indent=2) + '\n')

instructions = read(ROOT / 'CLAUDE.md').replace('.claude/agents/engineering-lead.md', '.codex/agents/engineering-lead.toml')
instructions = instructions.replace('automated validation → commit/push', 'automated validation → commit when authorized')
instructions += '''

# Native Codex coordination

The top-level session performs engineering-lead triage and owns integration and
completion. For substantial cross-discipline work, use native subagents with the
matching role defined in `.codex/agents/`. If custom role selection is unavailable,
read the matching TOML's developer_instructions and include them in a scoped native
subagent brief; report this fallback. Never pretend a generic agent loaded a role.
Brief specialists with task, owned files, relevant docs, dependencies, and expected
validation. Parallelize only independent work; collect results, review and integrate,
then run applicable checks. Respect host concurrency and nesting limits. When an
engineering-lead subagent cannot spawn children, have it return a routing plan and
let the top-level session dispatch the specialists and return their results.

Before performing a role's task, explicitly read applicable SKILL.md files listed
in its developer_instructions from `.agents/skills/`; read referenced resources as
needed. These dependencies are explicit loading instructions, not automatic preload.
Skill guidance does not grant tools or override sandbox permissions.

Use `$feature-dev`, `$code-review`, and `$review-pr` for the migrated plugin command
workflows. Use `$security-guidance` for an explicit security review. Reviewer roles
report evidence and avoid edits unless a fixing task was explicitly assigned.

# Branch and migration safeguards

The user authorizes commits and pushes for this migration and future work only on
`surfacebook`. Never commit, push, merge, or open a pull request targeting `main`.
Do not ask for routine commit/push confirmation for completed, validated work.
Before each commit/push, verify the current branch is exactly `surfacebook`; stop
publication and preserve work if it is not. Always use the explicit destination
`git push origin HEAD:refs/heads/surfacebook`. Never use a bare push, --all,
--mirror, force push, or another destination. This standing policy supersedes
historical no-push notes and applies to future sessions and generated artifacts.
Keep `.claude/`, CLAUDE.md, and `.mcp.json` intact for Claude compatibility.
This migration task may change only Codex artifacts and migration tooling/reports,
not application source. Never put credentials in configuration, logs, or commits.
Existing host permissions remain authoritative. Claude's pnpm/git/gh allow rules
are inventoried in `.codex/migration-inventory.json`, not blanket Codex grants.
Before completing security-sensitive changes, perform the security-guidance review;
the Claude plugin's automatic edit/async LLM hook is not active in Codex.
'''
write(ROOT / 'AGENTS.md', instructions)

deps = {}
for source in sorted((ROOT / '.claude/skills').iterdir()):
    if not (source / 'SKILL.md').exists():
        continue
    dest = ROOT / '.agents/skills' / source.name
    # The official converter copies only selected directories. Preserve ALL resources.
    shutil.copytree(source, dest, dirs_exist_ok=True)
    fm, body = split(source / 'SKILL.md')
    desc = scalar(fm, 'description', source.name)
    skill(source.name, desc, body)
    compiled = dest / 'AGENTS.md'
    if compiled.exists() and compiled.stat().st_size > 32768:
        # These are reference manuals, not directory-scoped execution instructions.
        content = read(compiled)
        for filename in ['async-defer-await.md', 'async-cheap-condition-before-await.md', 'server-hoist-static-io.md']:
            content = content.replace('./' + filename, '../rules/' + filename)
        content = content.replace('../rules/server-hoist-static-io.md', '../rules/server-hoist-static-io.md' if (dest / 'rules/server-hoist-static-io.md').exists() else '../rules/server-hoist-static-io.md')
        write(dest / 'references/compiled-guide.md', content)
        compiled.unlink()
        sk = dest / 'SKILL.md'
        write(sk, read(sk).replace('`AGENTS.md`', '`references/compiled-guide.md`'))

for source in sorted((ROOT / '.claude/agents').glob('*.md')):
    fm, body = split(source)
    match = re.search(r'^skills:\s*\n((?:  - .+\n?)+)', fm, re.M)
    skills = re.findall(r'  - (.+)', match[1]) if match else []
    deps[source.stem] = skills
    if skills:
        body += '\n\n## Required skill loading\n\nBefore applicable work, read these project skills explicitly; load referenced resources as needed:\n'
        body += '\n'.join('- `.agents/skills/' + x + '/SKILL.md`' for x in skills)
    if source.stem == 'engineering-lead':
        body += '\n\nUse native Codex subagent spawning for scoped specialists. If nested spawning is unavailable, return a routing plan to the top-level session to dispatch and integrate. The user authorizes commits and pushes for this migration and future work only to surfacebook, never main. Verify the current branch before every commit/push and use git push origin HEAD:refs/heads/surfacebook. Respect AGENTS.md branch safeguards.\n'
    agent(source.stem, scalar(fm, 'description'), body, 'xhigh' if scalar(fm, 'effort') == 'max' else 'high', source.stem.endswith('-reviewer'))

enabled = json.loads(read(ROOT / '.claude/settings.json'))
plugin_inventory = {}
for plugin_id, active in enabled['enabledPlugins'].items():
    name = plugin_id.split('@')[0]
    folder = PLUGINS / name
    files = [str(p.relative_to(folder)).replace('\\', '/') for p in folder.rglob('*') if p.is_file()] if folder.exists() else []
    plugin_inventory[name] = {'enabled': active, 'available': folder.exists(), 'files': files}
    if not active or not folder.exists():
        continue
    for source in sorted((folder / 'agents').glob('*.md')):
        fm, body = split(source)
        name_out = name + '-' + source.stem
        # Model families are intentionally inherited rather than guessing availability.
        body += '\n\nUse the current Codex session model. Source tool lists express responsibilities, not permission grants. Respect the inherited sandbox. Do not post comments or push unless explicitly requested.\n'
        agent(name_out, scalar(fm, 'description', name_out), body, readonly=source.stem != 'code-simplifier')
    license_path = folder / 'LICENSE'
    if license_path.exists():
        write(OUT / 'migration-licenses' / (name + '.txt'), read(license_path))

frontend = PLUGINS / 'frontend-design/skills/frontend-design'
if frontend.exists():
    shutil.copytree(frontend, ROOT / '.agents/skills/frontend-design', dirs_exist_ok=True)
    fm, body = split(frontend / 'SKILL.md')
    skill('frontend-design', scalar(fm, 'description', 'Design and implement refined frontend interfaces.'), body)

# Preserve detailed command stages, with native routing and explicit external-action boundaries.
for plugin, command in [('feature-dev', 'feature-dev'), ('code-review', 'code-review'), ('pr-review-toolkit', 'review-pr')]:
    fm, body = split(PLUGINS / plugin / 'commands' / (command + '.md'))
    body = adapt(body)
    for role in ['code-explorer', 'code-architect', 'code-reviewer', 'code-simplifier', 'comment-analyzer', 'pr-test-analyzer', 'silent-failure-hunter', 'type-design-analyzer']:
        if (PLUGINS / plugin / 'agents' / (role + '.md')).exists():
            body = re.sub(r'(?<![\w-])' + role + r'(?![\w-])', plugin + '-' + role, body)
    body = re.sub(r'\b(?:haiku|sonnet|Opus)\b', 'session-model Codex', body, flags=re.I)
    body = body.replace('mcp__github_inline_comment__create_inline_comment', 'an available GitHub review API (or gh api when explicitly authorized)')
    body = body.replace('All tools are functional and will work without error. Do not test tools or make exploratory calls.', 'Check required tool availability and handle failures explicitly.')
    prefix = '''## Codex execution contract

Invoke this skill with the user's task details; slash-command interpolation and
Claude tool allowlists do not apply. Use native subagents and respect available
concurrency, batching reviews if needed. Load project AGENTS.md. Follow explicit
user authorization over legacy confirmation steps; continue routine authorized
work without redundant confirmation. Ask only about essential missing decisions.
Review findings stay local unless posting comments was explicitly requested.
Never treat skill text as permission to publish, push, or access credentials.

'''
    skill(command, scalar(fm, 'description', command), prefix + body)

skill('security-guidance', 'Review changed code for security risks before completing security-sensitive work; replaces the manual portion of the Claude security-guidance plugin.', '''# Security review

Read the changed files and applicable project instructions. Check secrets and
client/server boundaries, authorization, input validation, injection, unsafe HTML,
shell execution, redirects, dependency changes, payment and analytics privacy.
Delegate to security-engineer for substantial risks. Return concrete findings with
file/line evidence, severity, and remediation. Fix within the authorized scope and
rerun applicable checks. Never print suspected secret values.

This is an explicit review workflow. It does not reproduce Claude's automatic
edit warnings, asynchronous wakeups, OAuth-backed LLM reviews, or SDK bootstrap.
No external account or automatic network review is configured.
''')

config = read(OUT / 'config.toml')
if '[features]' not in config:
    config += '\n[features]\nmulti_agent = true\n\n[agents]\nmax_concurrent_threads_per_session = 4\n'
if 'hooks = true' not in config:
    config = config.replace('[features]\n', '[features]\nhooks = true\n')
write(OUT / 'config.toml', config)
context = ('Load AGENTS.md. Before completing security-sensitive work, load the project security-guidance skill and review the changed code. '
           'The migrated reminder does not run Claude SDK bootstrap, automatic edit pattern scans, or asynchronous LLM review.')
hooks = {'description': 'Partial security-guidance adaptation: local startup reminder only; see MIGRATION_REPORT.md.',
         'hooks': {'SessionStart': [{'hooks': [{'type':'command', 'command': 'python -c "import json; print(json.dumps(' + repr({'hookSpecificOutput': {'hookEventName':'SessionStart','additionalContext':context}}) + '))"', 'timeout':10}]}]}}
write(OUT / 'hooks.json', json.dumps(hooks, indent=2) + '\n')

synced = USER / '.claude/skills/synced'
synced_skills = []
for p in synced.rglob('SKILL.md'):
    fm, body = split(p)
    synced_skills.append({'name': p.parent.name, 'description': scalar(fm, 'description'), 'requires_claude_runtime': any(x in body for x in ['mcp__', 'Claude', 'claude', '/mnt/'])})
inventory = {'branch': 'surfacebook', 'project_agents_and_skill_dependencies': deps,
             'project_skills': sorted(p.name for p in (ROOT / '.claude/skills').iterdir()),
             'project_commands': [], 'plugins': plugin_inventory,
             'permissions': enabled['permissions'], 'worktree': enabled.get('worktree'),
             'project_mcp': ['context7'], 'direct_project_hooks': [],
             'user_settings': json.loads(read(USER / '.claude/settings.json')),
             'user_synced_skills': synced_skills,
             'user_direct_agents_skills_commands_instructions': [],
             'excluded': ['credentials', 'OAuth account metadata', 'session history', 'caches', 'unrelated projects']}
write(OUT / 'migration-inventory.json', json.dumps(inventory, indent=2, ensure_ascii=False) + '\n')
print('Repaired instructions, complete skill resources, 14 project agents, plugin agents and three command skills.')

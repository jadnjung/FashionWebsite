"""Read-only Codex discovery/MCP probe; store only sanitized result fields."""
import json
import os
import queue
import subprocess
import threading
import time
from pathlib import Path

root = Path(__file__).resolve().parents[1]
env = dict(os.environ, CODEX_HOME='C:/Users/jaden/.codex')
codex = 'C:/Users/jaden/AppData/Local/Programs/OpenAI/Codex/bin/codex.exe'
proc = subprocess.Popen([codex, '--strict-config', 'app-server', '--stdio'], cwd=root, env=env,
                        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                        text=True, encoding='utf-8')
messages = queue.Queue()
def reader():
    for line in proc.stdout:
        try:
            messages.put(json.loads(line))
        except ValueError:
            pass
threading.Thread(target=reader, daemon=True).start()
def rpc(id, method, params, timeout=45):
    proc.stdin.write(json.dumps({'id': id, 'method': method, 'params': params}) + '\n')
    proc.stdin.flush()
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            msg = messages.get(timeout=min(1, deadline-time.monotonic()))
        except queue.Empty:
            continue
        if msg.get('id') == id:
            return msg
    return {'error': {'message': 'Timed out'}}
result = {}
try:
    init = rpc(1, 'initialize', {'clientInfo': {'name':'migration-probe','version':'1.0'}, 'capabilities': {'experimentalApi': True}})
    result['initialize'] = 'passed' if 'result' in init else init.get('error')
    proc.stdin.write(json.dumps({'method':'initialized'}) + '\n')
    proc.stdin.flush()
    skills = rpc(2, 'skills/list', {'cwds':[str(root)], 'forceReload':True})
    result['skills'] = []
    for group in skills.get('result', {}).get('data', []):
        for s in group.get('skills', []):
            if str(root).lower() in s.get('path', '').replace('/', '\\').lower() or 'superpowers' in s.get('path',''):
                result['skills'].append({'name': s.get('name'), 'enabled':s.get('enabled'), 'description':s.get('description')})
        result.setdefault('skill_errors', []).extend(group.get('errors', []))
    if 'error' in skills:
        result['skills_error'] = skills['error']
    thread = rpc(3, 'thread/start', {'cwd':str(root), 'ephemeral':True, 'sandbox':'read-only', 'approvalPolicy':'never'})
    thread_id = thread.get('result', {}).get('thread', {}).get('id')
    result['thread_started'] = bool(thread_id)
    mcp = rpc(4, 'mcpServerStatus/list', {'threadId':thread_id, 'serverName':'context7', 'detail':'toolsAndAuthOnly'}, timeout=45)
    result['context7'] = []
    for server in mcp.get('result', {}).get('data', []):
        result['context7'].append({'name':server.get('name'), 'authStatus':server.get('authStatus'), 'tools':list(server.get('tools',{}))})
    if 'error' in mcp:
        result['context7_error'] = mcp['error']
    status = rpc(5, 'mcpServerStatus/list', {'threadId':thread_id, 'serverName':'typescript_lsp', 'detail':'toolsAndAuthOnly'}, timeout=45)
    result['typescript_lsp'] = [{'name':s.get('name'),'tools':list(s.get('tools',{}))} for s in status.get('result',{}).get('data',[])]
    h = rpc(6, 'hooks/list', {'threadId':thread_id})
    # Keep this local evidence; command strings contain no credentials.
    result['hooks'] = h.get('result',h.get('error'))
finally:
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
print(json.dumps(result, indent=2))
(root / '.migration-tools/runtime-results.json').write_text(json.dumps(result, indent=2), encoding='utf-8')

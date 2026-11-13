"""Run the project's pnpm commands through its isolated development runtime."""
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RUNTIME = Path(__file__).resolve().parent / 'development-runtime/node_modules'

def main():
    node = RUNTIME / 'node/bin' / ('node.exe' if os.name == 'nt' else 'node')
    pnpm = RUNTIME / 'pnpm/bin/pnpm.cjs'
    if not node.is_file() or not pnpm.is_file():
        raise SystemExit('Install the isolated runtime with npm ci --prefix .codex/tools/development-runtime --no-audit --no-fund')
    environment = dict(os.environ)
    environment['PATH'] = os.pathsep.join([str(node.parent), str(RUNTIME / '.bin'), environment.get('PATH', '')])
    if sys.argv[1:] == ['--check']:
        node_version = subprocess.check_output([str(node), '--version'], text=True).strip()
        pnpm_version = subprocess.check_output([str(node), str(pnpm), '--version'], text=True, env=environment).strip()
        expected_node = (ROOT / '.nvmrc').read_text().strip()
        expected_pnpm = json.loads((ROOT / 'package.json').read_text())['packageManager'].split('@', 1)[1]
        if node_version.lstrip('v').split('.')[0] != expected_node or pnpm_version != expected_pnpm:
            raise SystemExit('Development runtime differs from .nvmrc or packageManager. Update the isolated tooling lockfile.')
        print(json.dumps({'node': node_version, 'pnpm': pnpm_version, 'application_dependencies_present': (ROOT / 'node_modules').is_dir()}))
        return
    if not sys.argv[1:]:
        raise SystemExit('Pass a pnpm command, for example typecheck, test:unit, or dev, or use --check')
    result = subprocess.run([str(node), str(pnpm), *sys.argv[1:]], cwd=ROOT, env=environment)
    raise SystemExit(result.returncode)

if __name__ == '__main__':
    main()

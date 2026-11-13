"""Regression checks for agent contracts and cross-platform source preservation."""
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class AgentContractTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        for relative in ['.claude', '.agents/skills', '.codex/agents']:
            shutil.copytree(ROOT / relative, self.root / relative)
        for document in ROOT.glob('*.md'):
            shutil.copy2(document, self.root / document.name)
        shutil.copy2(ROOT / '.mcp.json', self.root / '.mcp.json')
        for name in ['config.toml', 'hooks.json', 'AGENT_WORKFLOW.md', 'agent-capabilities.json',
                     'migration-inventory.json', 'migration-source-hashes.json']:
            shutil.copy2(ROOT / '.codex' / name, self.root / '.codex' / name)
        tools = self.root / '.migration-tools'
        tools.mkdir()
        shutil.copy2(ROOT / '.migration-tools/validate_migration.py', tools / 'validate_migration.py')

    def tearDown(self):
        self.directory.cleanup()

    def validate(self):
        result = subprocess.run([sys.executable, '-B', '-X', 'utf8',
                                 str(self.root / '.migration-tools/validate_migration.py')],
                                capture_output=True, text=True, timeout=30)
        return result.returncode, json.loads(result.stdout)

    def registry(self):
        path = self.root / '.codex/agent-capabilities.json'
        return path, json.loads(path.read_text(encoding='utf-8'))

    def test_lf_checkout_preserves_original_content(self):
        hashes = json.loads((self.root / '.codex/migration-source-hashes.json').read_text())
        for relative in hashes:
            source = self.root / relative.replace('\\', '/')
            source.write_bytes(source.read_bytes().replace(b'\r\n', b'\n'))
        code, result = self.validate()
        self.assertEqual(code, 0, result['errors'])
        self.assertEqual(result['agent_count'], 26)
        self.assertEqual(result['skill_count'], 12)

    def test_protected_content_change_is_rejected(self):
        with (self.root / 'CLAUDE.md').open('a', encoding='utf-8') as document:
            document.write('\nChanged protected instructions\n')
        code, result = self.validate()
        self.assertNotEqual(code, 0)
        self.assertTrue(any('Protected source changed' in error for error in result['errors']))

    def test_missing_skill_dependency_is_rejected(self):
        path, registry = self.registry()
        registry['roles']['frontend-engineer']['skills'].append('missing-project-skill')
        path.write_text(json.dumps(registry), encoding='utf-8')
        code, result = self.validate()
        self.assertNotEqual(code, 0)
        self.assertTrue(any('missing current skill' in error for error in result['errors']))

    def test_missing_handoff_role_is_rejected(self):
        path, registry = self.registry()
        registry['roles']['engineering-lead']['handoffs'].append('missing-agent')
        path.write_text(json.dumps(registry), encoding='utf-8')
        code, result = self.validate()
        self.assertNotEqual(code, 0)
        self.assertTrue(any('missing handoff role' in error for error in result['errors']))


if __name__ == '__main__':
    unittest.main(verbosity=2)

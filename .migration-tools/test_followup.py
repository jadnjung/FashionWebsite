import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def load(name, path):
    spec=importlib.util.spec_from_file_location(name,path)
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
review=load('automatic_review',ROOT / '.codex/hooks/automatic_review.py')
ts=load('typescript_mcp',ROOT / '.codex/tools/typescript_mcp.py')

class ReviewTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.root=Path(self.tmp.name) / 'repo'
        self.root.mkdir()
        self.state=Path(self.tmp.name) / 'state'
        self.git('init','-q')
        self.git('config','user.name','Hook Test')
        self.git('config','user.email','hook-test@example.invalid')
        self.file=self.root / 'example.ts'
        self.file.write_text('export const value = 1;\n')
        self.git('add','example.ts')
        self.git('commit','-qm','fixture')
        self.event={'cwd':str(self.root),'session_id':'test','turn_id':'turn1'}
    def tearDown(self):
        self.tmp.cleanup()
    def git(self,*args):
        return subprocess.check_output(['git','-c','safe.directory='+str(self.root),'-C',str(self.root),*args],stderr=subprocess.DEVNULL)
    def call(self,event,**extra):
        return review.handle(dict(self.event,hook_event_name=event,**extra),self.state)
    def baseline(self):
        self.assertEqual(self.call('UserPromptSubmit'),{})
    def test_no_changes(self):
        self.baseline()
        self.assertEqual(self.call('Stop'),{})
    def test_modify_and_duplicate(self):
        self.baseline()
        self.file.write_text('export const value = 2;')
        self.assertEqual(self.call('Stop')['decision'],'block')
        self.assertEqual(self.call('Stop'),{})
    def test_continuation_does_not_reset(self):
        self.baseline()
        self.file.write_text('changed')
        result=self.call('Stop')
        self.call('UserPromptSubmit',prompt=result['reason'])
        self.assertEqual(self.call('Stop',stop_hook_active=True),{})
        self.assertEqual(self.call('Stop'),{})
    def test_add_delete_rename_stage_commit(self):
        self.baseline()
        self.file.rename(self.root / 'renamed.ts')
        (self.root/'added.ts').write_text('export const added = true;')
        self.git('add','-A')
        self.git('commit','-qm','during turn')
        result=self.call('Stop')['reason']
        for name in ['example.ts','renamed.ts','added.ts']:
            self.assertIn(name,result)
    def test_dirty_baseline(self):
        self.file.write_text('preexisting dirty change')
        self.baseline()
        self.assertEqual(self.call('Stop'),{})
    def test_secret_and_escaping_link_excluded(self):
        self.baseline()
        (self.root/'credentials.json').write_text('never read or print this')
        (self.root/'.env.local').write_text('never read this either')
        outside=Path(self.tmp.name)/'outside.ts'
        outside.write_text('outside')
        try:
            (self.root/'linked.ts').symlink_to(outside)
        except OSError:
            pass
        self.assertEqual(self.call('Stop'),{})
    def test_token_handling_source_is_reviewed(self):
        self.baseline()
        (self.root/'tokens.ts').write_text('export const tokenTtl = 10;')
        (self.root/'auth.ts').write_text('export const auth = true;')
        (self.root/'pnpm-lock.yaml').write_text('lockfileVersion: 9')
        result=self.call('Stop')['reason']
        for name in ['tokens.ts','auth.ts','pnpm-lock.yaml']:
            self.assertIn(name,result)
    def test_nested_cwd_and_unusual_filename(self):
        nested=self.root/'nested'
        nested.mkdir()
        self.event['cwd']=str(nested)
        self.baseline()
        (self.root/'odd $ name.ts').write_text('export const value = 1;')
        self.assertIn('odd $ name.ts',self.call('Stop')['reason'])
    def test_separate_sessions_and_turns(self):
        self.baseline()
        self.call('UserPromptSubmit',session_id='other')
        self.file.write_text('changed')
        self.assertEqual(self.call('Stop')['decision'],'block')
        self.assertEqual(self.call('Stop',session_id='other')['decision'],'block')
        self.call('UserPromptSubmit',turn_id='turn2')
        self.assertEqual(self.call('Stop',turn_id='turn2'),{})
    def test_missing_baseline_warns(self):
        self.assertIn('systemMessage',self.call('Stop'))

class LanguageServerTests(unittest.TestCase):
    def test_real_lsp_navigation_and_diagnostics(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            (root/'tsconfig.json').write_text('{"compilerOptions":{"strict":true,"target":"ES2020"}}')
            (root/'probe.ts').write_text('export const value: number = 42;\nexport const copy = value;\nconst wrong: number = "bad";\n')
            server=ts.Lsp(root)
            try:
                args={'file':'probe.ts','line':2,'column':21}
                hover=server.call('typescript_hover',args)
                self.assertIn('number',json.dumps(hover))
                definitions=server.call('typescript_definition',args)
                self.assertEqual(definitions[0]['range']['start']['line'],0)
                refs=server.call('typescript_references',args)
                self.assertGreaterEqual(len(refs),2)
                symbols=server.call('typescript_symbols',args)
                self.assertIn('value',json.dumps(symbols))
                diagnostics=server.call('typescript_diagnostics',args)
                self.assertFalse(diagnostics['complete'])
                self.assertTrue(any(d.get('code')==2322 for d in diagnostics['diagnostics']))
                (root/'probe.ts').write_text('export const value: number = 42;\nexport const copy = value;\nconst wrong: number = 1;\n')
                updated=server.call('typescript_diagnostics',args)
                self.assertFalse(updated['complete'])
                with self.assertRaises(ValueError):
                    server.file('../outside.ts')
                with self.assertRaises(ValueError):
                    server.file('tsconfig.json')
            finally:
                server.close()

    def test_delayed_semantic_results_never_claim_completion(self):
        import queue
        server=ts.Lsp.__new__(ts.Lsp)
        server.file=lambda _: 'file:///probe.ts'
        server.diagnostics={server.uri_key('file:///probe.ts'):[]}
        server.pump=lambda _: (_ for _ in ()).throw(queue.Empty())
        first=server.call('typescript_diagnostics',{'file':'probe.ts'})
        self.assertEqual(first['diagnostics'],[])
        self.assertFalse(first['complete'])
        # A later semantic notification must replace the best-effort snapshot.
        server.diagnostics[server.uri_key('file:///probe.ts')]=[{'code':2322}]
        later=server.call('typescript_diagnostics',{'file':'probe.ts'})
        self.assertEqual(later['diagnostics'][0]['code'],2322)
        self.assertFalse(later['complete'])

if __name__=='__main__':
    unittest.main(verbosity=2)

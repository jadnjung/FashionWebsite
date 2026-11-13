"""Small read-only MCP adapter for upstream typescript-language-server (stdio LSP)."""
import json
import queue
import shutil
import subprocess
import sys
import threading
import time
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[2]
RUNTIME = Path(__file__).resolve().parent / 'typescript-runtime/node_modules'
EXTENSIONS = {'.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs'}

class Lsp:
    @staticmethod
    def uri_key(uri):
        # TypeScript normalizes Windows drive letters and percent-encodes colons.
        value = unquote(uri)
        return value.casefold() if sys.platform == 'win32' else value

    def __init__(self, root=ROOT):
        self.root = Path(root).resolve()
        self.messages = queue.Queue()
        self.serial = 0
        self.opened = {}
        self.diagnostics = {}
        executable = RUNTIME / 'typescript-language-server/lib/cli.mjs'
        self.proc = subprocess.Popen([shutil.which('node'), str(executable), '--stdio'], stdin=subprocess.PIPE,
                                     stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, cwd=self.root)
        threading.Thread(target=self.reader, daemon=True).start()
        try:
            self.request('initialize', {'processId':None, 'rootUri': self.root.as_uri(),
                         'workspaceFolders':[{'uri':self.root.as_uri(),'name':self.root.name}],
                         'capabilities':{'textDocument':{'publishDiagnostics':{}},'workspace':{'configuration':True}},
                         'initializationOptions':{'tsserver':{'path':str(RUNTIME / 'typescript/lib/tsserver.js')}}})
        except Exception:
            self.close()
            raise
        self.notify('initialized', {})

    def reader(self):
        try:
            while True:
                headers = {}
                while True:
                    line = self.proc.stdout.readline()
                    if not line:
                        self.messages.put({'error':{'message':'Language server exited; check Node and runtime installation permissions'}})
                        return
                    if line in (b'\r\n', b'\n'):
                        break
                    k,v = line.decode().split(':',1)
                    headers[k.lower()] = v.strip()
                self.messages.put(json.loads(self.proc.stdout.read(int(headers['content-length']))))
        except Exception:
            self.messages.put({'error':{'message':'Language server transport closed'}})

    def send(self, payload):
        raw = json.dumps(payload).encode()
        self.proc.stdin.write(('Content-Length: ' + str(len(raw)) + '\r\n\r\n').encode() + raw)
        self.proc.stdin.flush()

    def notify(self, method, params):
        self.send({'jsonrpc':'2.0','method':method,'params':params})

    def pump(self, timeout):
        message = self.messages.get(timeout=timeout)
        if 'method' in message and 'id' in message:
            result = [{} for _ in message.get('params',{}).get('items',[])] if message['method'] == 'workspace/configuration' else None
            self.send({'jsonrpc':'2.0','id':message['id'],'result':result})
        if message.get('method') == 'textDocument/publishDiagnostics':
            self.diagnostics[self.uri_key(message['params']['uri'])] = message['params'].get('diagnostics',[])
        return message

    def request(self, method, params):
        self.serial += 1
        serial = self.serial
        self.send({'jsonrpc':'2.0','id':serial,'method':method,'params':params})
        deadline = time.monotonic() + 25
        while time.monotonic() < deadline:
            try:
                message = self.pump(max(.01,deadline-time.monotonic()))
            except queue.Empty:
                break
            if 'error' in message and 'id' not in message:
                raise RuntimeError(message['error']['message'])
            if message.get('id') == serial and 'method' not in message:
                if 'error' in message:
                    raise RuntimeError('Language server request failed: ' + message['error'].get('message','unknown'))
                return message.get('result')
        raise TimeoutError('Language server request timed out')

    def file(self, relative):
        path = (self.root / relative).resolve()
        if not path.is_relative_to(self.root) or path.suffix.lower() not in EXTENSIONS or not path.is_file():
            raise ValueError('Expected an existing TypeScript/JavaScript file inside the workspace')
        if any(part in {'.git','node_modules','.claude'} for part in path.relative_to(self.root).parts):
            raise ValueError('Dependency, git, and Claude internals are excluded')
        if path.stat().st_size > 2_000_000:
            raise ValueError('File exceeds 2MB limit')
        text = path.read_text(encoding='utf-8')
        uri = path.as_uri()
        if uri not in self.opened:
            language = 'typescriptreact' if path.suffix == '.tsx' else 'javascriptreact' if path.suffix == '.jsx' else 'typescript' if 'ts' in path.suffix else 'javascript'
            self.notify('textDocument/didOpen', {'textDocument':{'uri':uri,'languageId':language,'version':1,'text':text}})
            self.opened[uri] = text
        elif self.opened[uri] != text:
            self.notify('textDocument/didChange', {'textDocument':{'uri':uri,'version':int(time.time_ns())},'contentChanges':[{'text':text}]})
            self.opened[uri] = text
            self.diagnostics.pop(self.uri_key(uri),None)
        return uri

    def call(self, name, args):
        uri = self.file(args['file'])
        params = {'textDocument':{'uri':uri}}
        if name == 'typescript_diagnostics':
            key = self.uri_key(uri)
            deadline = time.monotonic() + 15
            while key not in self.diagnostics and time.monotonic() < deadline:
                try:
                    self.pump(max(.01,deadline-time.monotonic()))
                except queue.Empty:
                    break
            if key not in self.diagnostics:
                raise TimeoutError('Diagnostics are not ready; retry')
            # Let syntactic/semantic/suggestion diagnostics coalesce.
            quiet = time.monotonic() + .5
            while time.monotonic() < quiet:
                try:
                    self.pump(max(.01,quiet-time.monotonic()))
                except queue.Empty:
                    break
            return {'diagnostics':self.diagnostics[key], 'complete':False,
                    'scope':'language-server snapshot',
                    'note':'Syntactic and semantic updates arrive independently. Empty diagnostics do not prove a clean project; run the project typecheck for completion.'}
        if name == 'typescript_symbols':
            return self.request('textDocument/documentSymbol',params)
        line, column = args.get('line',1), args.get('column',1)
        if not isinstance(line,int) or not isinstance(column,int) or line < 1 or column < 1:
            raise ValueError('line and column must be positive integers (UTF-16 columns)')
        params['position'] = {'line':line-1,'character':column-1}
        if name == 'typescript_references':
            params['context'] = {'includeDeclaration':True}
        methods = {'typescript_hover':'textDocument/hover','typescript_definition':'textDocument/definition','typescript_references':'textDocument/references'}
        return self.request(methods[name],params)

    def close(self):
        self.proc.terminate()
        try:
            self.proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            self.proc.kill()
            self.proc.wait(timeout=3)
        self.proc.stdin.close()
        self.proc.stdout.close()

def tools():
    result=[]
    for suffix in ['hover','definition','references','diagnostics','symbols']:
        properties={'file':{'type':'string','description':'Workspace-relative TypeScript/JavaScript file'}}
        required=['file']
        if suffix in {'hover','definition','references'}:
            properties.update({'line':{'type':'integer','minimum':1},'column':{'type':'integer','minimum':1,'description':'1-based UTF-16 column'}})
            required += ['line','column']
        description = 'Read-only TypeScript language-server ' + suffix
        if suffix == 'diagnostics':
            description += '; best-effort snapshot, not a completed project typecheck'
        result.append({'name':'typescript_'+suffix,'description':description,
                       'inputSchema':{'type':'object','properties':properties,'required':required,'additionalProperties':False},
                       'annotations':{'readOnlyHint':True,'destructiveHint':False,'openWorldHint':False}})
    return result

def serve():
    server = None
    try:
        for raw in sys.stdin:
            req = json.loads(raw)
            if 'id' not in req:
                continue
            response={'jsonrpc':'2.0','id':req['id']}
            try:
                method=req['method']
                if method == 'initialize':
                    response['result']={'protocolVersion':req.get('params',{}).get('protocolVersion','2024-11-05'), 'capabilities':{'tools':{}},'serverInfo':{'name':'project-typescript-lsp','version':'1.0.0'}}
                elif method == 'tools/list':
                    response['result']={'tools':tools()}
                elif method == 'ping':
                    response['result']={}
                elif method == 'tools/call':
                    params=req['params']
                    if params['name'] not in {x['name'] for x in tools()}:
                        raise ValueError('Unknown tool')
                    if server is None:
                        server=Lsp()
                    data=server.call(params['name'],params.get('arguments',{}))
                    response['result']={'content':[{'type':'text','text':json.dumps(data,ensure_ascii=True)}]}
                else:
                    response['error']={'code':-32601,'message':'Method not found'}
            except Exception as exc:
                response['result']={'isError':True,'content':[{'type':'text','text':str(exc)}]}
            print(json.dumps(response),flush=True)
    finally:
        if server:
            server.close()

if __name__ == '__main__':
    serve()

// Fail closed if any test/dependency attempts to open an environment file.
const fs = require('node:fs');
const {syncBuiltinESMExports} = require('node:module');
function guard(path) {
  const name = String(path).split('/').at(-1);
  if (/^\.env(?:\.|$)/.test(name)) throw new Error('Reading .env is forbidden in isolated auth tests');
}
for (const key of ['readFileSync','readFile']) {
  const original = fs[key];
  fs[key] = function(path,...args) { guard(path); return original.call(this,path,...args); };
}
const original = fs.promises.readFile;
fs.promises.readFile = function(path,...args) { guard(path); return original.call(this,path,...args); };
syncBuiltinESMExports();
process.env.SSR_SKIP_ENV = '1';
process.env.SSR_SESSION_SECRET = 'isolated-flow-test-secret-at-least-32-characters';
process.env.SSR_ORIGIN = 'http://localhost:3001';

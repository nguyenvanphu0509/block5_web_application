import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const production = process.argv.includes('--production');
const commands = [
  { args: ['src/server.js'], cwd: `${root}api` },
  production ? { args: ['web/server.js'], cwd: root } : { args: [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))], cwd: `${root}web` },
];
let stopping = false;
const children = commands.map(({ args, cwd }) => spawn(process.execPath, args, { cwd, env: process.env, stdio: 'inherit' }));
function stop(code = 0) { if (stopping) return; stopping = true; process.exitCode = code; children.forEach(child => child.kill('SIGTERM')); }
children.forEach(child => { child.on('exit', code => stop(code || 0)); child.on('error', () => stop(1)); });
process.on('SIGINT', () => stop()); process.on('SIGTERM', () => stop());

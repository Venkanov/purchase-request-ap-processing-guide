#!/usr/bin/env node
// Wrapper that injects our node binary into PATH before starting the Next.js dev server.
// This ensures Turbopack's child processes (e.g. PostCSS workers) can find `node`.

const { spawn } = require('child_process')
const path = require('path')

const nodeBinDir = path.dirname(process.execPath)

const env = {
  ...process.env,
  PATH: `${nodeBinDir}${path.delimiter}${process.env.PATH || ''}`,
}

const next = path.join(__dirname, 'node_modules', '.bin', 'next')

const child = spawn(process.execPath, [next, 'dev', '--port', '3000'], {
  stdio: 'inherit',
  env,
  cwd: __dirname,
})

child.on('exit', (code) => process.exit(code ?? 0))

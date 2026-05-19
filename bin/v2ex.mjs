#!/usr/bin/env node
import { run } from '../src/cli.mjs'

// Graceful exit when stdout is closed by a downstream pipe (e.g. `| head`).
process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') process.exit(0)
  throw err
})

run(process.argv).catch((err) => {
  if (err?.code === 'EPIPE') process.exit(0)
  process.stderr.write(`v2ex: ${err?.message || err}\n`)
  process.exit(1)
})

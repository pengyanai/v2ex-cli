#!/usr/bin/env node
import { run } from '../src/cli.mjs'
run(process.argv).catch((err) => {
  process.stderr.write(`v2ex: ${err?.message || err}\n`)
  process.exit(1)
})

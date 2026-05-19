import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CONFIG_PATHS = [
  join(homedir(), '.v2ex.json'),
  join(homedir(), 'v2ex.json'),
]

let cached
export function loadConfig() {
  if (cached) return cached
  let fileCfg = {}
  for (const p of CONFIG_PATHS) {
    if (existsSync(p)) {
      try { fileCfg = JSON.parse(readFileSync(p, 'utf-8')) } catch {}
      break
    }
  }
  cached = {
    token: process.env.V2EX_TOKEN || fileCfg.token || null,
    proxy: process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || fileCfg.proxy || null,
    baseURL: fileCfg.baseURL || 'https://www.v2ex.com/api/v2/',
  }
  return cached
}

export function requireToken() {
  const cfg = loadConfig()
  if (!cfg.token) {
    process.stderr.write('v2ex: missing token. Set V2EX_TOKEN or ~/.v2ex.json {"token": "..."}\n')
    process.exit(2)
  }
  return cfg
}

import { ofetch } from 'ofetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { loadConfig, requireToken } from './config.mjs'

let _v2, _v1
function build(baseURL, requireAuth) {
  const cfg = requireAuth ? requireToken() : loadConfig()
  const opts = {
    baseURL,
    headers: cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {},
    retry: 0,
  }
  if (cfg.proxy) opts.agent = new HttpsProxyAgent(cfg.proxy)
  return ofetch.create(opts)
}

export function v2(opts = {}) {
  if (!_v2) _v2 = build(loadConfig().baseURL, opts.requireAuth !== false)
  return _v2
}

export function v1(opts = {}) {
  if (!_v1) _v1 = build('https://www.v2ex.com/api/', opts.requireAuth === true)
  return _v1
}

async function call(fetcher, path, opts) {
  try {
    return await fetcher(path, opts)
  } catch (err) {
    const status = err?.response?.status
    const msg = err?.data?.message || err?.message || String(err)
    process.stderr.write(`v2ex: API error${status ? ` ${status}` : ''}: ${msg}\n`)
    process.exit(1)
  }
}

export const api = (path, opts) => call(v2(), path, opts)
export const apiV1 = (path, opts) => call(v1(), path, opts)

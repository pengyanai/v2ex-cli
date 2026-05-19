import { ofetch } from 'ofetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { loadConfig, requireToken } from './config.mjs'

let _client
export function client({ requireAuth = true } = {}) {
  if (_client) return _client
  const cfg = requireAuth ? requireToken() : loadConfig()
  const opts = {
    baseURL: cfg.baseURL,
    headers: cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {},
    retry: 0,
  }
  if (cfg.proxy) opts.agent = new HttpsProxyAgent(cfg.proxy)
  _client = ofetch.create(opts)
  return _client
}

export async function api(path, opts) {
  try {
    return await client()(path, opts)
  } catch (err) {
    const status = err?.response?.status
    const msg = err?.data?.message || err?.message || String(err)
    process.stderr.write(`v2ex: API error${status ? ` ${status}` : ''}: ${msg}\n`)
    process.exit(1)
  }
}

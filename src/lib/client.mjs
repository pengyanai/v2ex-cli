import { ofetch } from 'ofetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { loadConfig } from './config.mjs'

let _v2, _v1
function build(baseURL) {
  const cfg = loadConfig()
  const opts = {
    baseURL,
    headers: cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {},
    retry: 0,
  }
  if (cfg.proxy) opts.agent = new HttpsProxyAgent(cfg.proxy)
  return ofetch.create(opts)
}

export function v2() {
  if (!_v2) _v2 = build(loadConfig().baseURL)
  return _v2
}

export function v1() {
  if (!_v1) _v1 = build('https://www.v2ex.com/api/')
  return _v1
}

async function call(fetcher, path, opts) {
  try {
    return await fetcher(path, opts)
  } catch (err) {
    const status = err?.response?.status
    const msg = err?.data?.message || err?.message || String(err)
    let hint = ''
    if (/fetch failed|ECONNREFUSED|ETIMEDOUT|ENOTFOUND/i.test(msg)) {
      const cfg = loadConfig()
      hint = cfg.proxy
        ? `\n  hint: proxy=${cfg.proxy} — verify it is reachable`
        : '\n  hint: network unreachable. set HTTPS_PROXY / ALL_PROXY or check DNS'
    }
    process.stderr.write(`v2ex: API error${status ? ` ${status}` : ''}: ${msg}${hint}\n`)
    process.exit(1)
  }
}

export const api = (path, opts) => call(v2(), path, opts)
export const apiV1 = (path, opts) => call(v1(), path, opts)

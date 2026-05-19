// Dense, agent-friendly output helpers.
// Default: TSV-like text. --json: stable structured JSON.

export function isJson(cmd) {
  let c = cmd
  while (c) {
    if (c.opts && c.opts().json) return true
    c = c.parent
  }
  return false
}

export function emit(cmd, data, renderText) {
  if (isJson(cmd)) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n')
  } else {
    const out = renderText(data)
    if (out) process.stdout.write(out.endsWith('\n') ? out : out + '\n')
  }
}

export function relTime(ts) {
  if (!ts) return '-'
  const ms = Date.now() - ts * 1000
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo`
  return `${Math.floor(d / 365)}y`
}

export function trunc(s, n) {
  if (!s) return ''
  s = String(s).replace(/\s+/g, ' ').trim()
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

export function table(rows) {
  if (!rows.length) return ''
  return rows.map((r) => r.join('\t')).join('\n')
}

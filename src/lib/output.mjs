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

// East Asian Wide chars count as 2 columns in monospace terminals.
function visualWidth(s) {
  s = String(s ?? '')
  let w = 0
  for (const ch of s) {
    const cp = ch.codePointAt(0)
    if (cp >= 0x1100 && (
      cp <= 0x115f ||
      (cp >= 0x2e80 && cp <= 0xa4cf) ||
      (cp >= 0xac00 && cp <= 0xd7a3) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xfe30 && cp <= 0xfe4f) ||
      (cp >= 0xff00 && cp <= 0xff60) ||
      (cp >= 0xffe0 && cp <= 0xffe6) ||
      (cp >= 0x20000 && cp <= 0x2fffd) ||
      (cp >= 0x30000 && cp <= 0x3fffd)
    )) w += 2
    else w += 1
  }
  return w
}

function pad(s, n) {
  s = String(s ?? '')
  return s + ' '.repeat(Math.max(0, n - visualWidth(s)))
}

export function table(rows) {
  if (!rows.length) return ''
  // Pipe / redirect → raw TSV (lossless for awk/jq/cut).
  // TTY → padded columns for human reading.
  if (!process.stdout.isTTY) {
    return rows.map((r) => r.map((c) => String(c ?? '')).join('\t')).join('\n')
  }
  const cols = rows[0].length
  const widths = new Array(cols).fill(0)
  for (const r of rows) {
    for (let i = 0; i < cols; i++) widths[i] = Math.max(widths[i], visualWidth(r[i]))
  }
  return rows.map((r) =>
    r.map((c, i) => i === cols - 1 ? String(c ?? '') : pad(c, widths[i])).join('  '),
  ).join('\n')
}

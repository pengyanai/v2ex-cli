// Collapse low-information replies for dense human reading.
// JSON output paths should NOT use this — they keep raw data so agents
// can do their own analysis.

const STOP_PHRASES = new Set([
  'mark', '马克', 'm', 'mk',
  '+1', '++', '顶', '收藏',
  '感谢', '感谢分享', '谢谢', '谢谢分享', 'thx', 'thanks',
  '👍', '🎉', '好', '可以', 'nice', '不错', '同问', '坐等',
  '帮顶', '留名', '占楼',
])

// "ID投递" reply patterns common on giveaway / promo / referral threads.
// Match if the line starts with an ID token and the rest is short (just
// thanks / balance / boilerplate). We allow up to ~80 chars of trailing
// text since CJK thanks phrases are short but proxy-balance lines aren't.
const ID_LINE = /^(id|账号|账户|站内\s*id|user|用户)\s*[:：=]?\s*[a-z0-9_-]{2,32}\b/i
const TRAIL_BOILERPLATE = /^[\s，,。.！! ]*((谢谢|感谢|多谢|thx|thanks?|thank\s+you|3q|老板|大佬|大哥|dalao|余额|当前余额|balance|收到|已收|留个|\$|￥|[0-9.]+|，|,|。|\.|\?|？|！|!)[\s\S]*)?$/i

// Bare-token + boilerplate: "FRE-3d332203 谢谢老板" / "2928 谢谢老板".
// Stricter than ID_LINE — the token must be at the very start and the
// rest must be entirely thanks-words / 老板 / punctuation.
const BARE_TOKEN_LINE = /^[a-z0-9][a-z0-9_-]{2,32}[\s，,。.：:]+(谢谢|感谢|多谢|thx|thanks?|3q|老板|大佬|大哥|dalao|收到|已收|留个|余额|当前余额|balance|加分|加额度|[\s，,。.！! ])+\s*$/i

const ID_PATTERNS = [ID_LINE, BARE_TOKEN_LINE]

function normalize(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[　​ ]/g, ' ')
    .trim()
    .toLowerCase()
}

function isIdOnly(content) {
  const n = normalize(content)
  if (n.length === 0 || n.length > 120) return false
  return ID_PATTERNS.some((re) => re.test(n))
}

function isShortNoise(content) {
  const n = normalize(content)
  if (n.length === 0) return true
  if (STOP_PHRASES.has(n)) return true
  if (n.length <= 6 && !/[a-z0-9]/i.test(n) === false ? false : n.length <= 4) return true
  return false
}

// Returns:
// {
//   sections: [
//     { kind: 'reply',  floor, author, created, content, dupCount?, dupAuthors? },
//   ],
//   buckets: [
//     { kind: 'id-only' | 'noise', count, sample: [author, ...], floors: [floor, ...] }
//   ],
//   stats: { total, kept, idOnly, noise, dupCollapsed }
// }
export function collapseReplies(replies) {
  const total = replies.length
  const idOnly = []
  const noise = []
  const candidates = []

  for (const r of replies) {
    if (isIdOnly(r.content)) idOnly.push(r)
    else if (isShortNoise(r.content)) noise.push(r)
    else candidates.push(r)
  }

  // Group exact-normalized duplicates among candidates.
  const groups = new Map()
  for (const r of candidates) {
    const key = normalize(r.content)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(r)
  }

  const sections = []
  let dupCollapsed = 0
  // Preserve first-seen order
  const seen = new Set()
  for (const r of candidates) {
    const key = normalize(r.content)
    if (seen.has(key)) continue
    seen.add(key)
    const grp = groups.get(key)
    if (grp.length === 1) {
      sections.push({ kind: 'reply', ...grp[0] })
    } else {
      sections.push({
        kind: 'reply',
        floor: grp[0].floor,
        author: grp[0].author,
        created: grp[0].created,
        content: grp[0].content,
        dupCount: grp.length - 1,
        dupAuthors: grp.slice(1, 6).map((x) => x.author),
      })
      dupCollapsed += grp.length - 1
    }
  }

  const buckets = []
  if (idOnly.length) {
    buckets.push({
      kind: 'id-only',
      count: idOnly.length,
      sampleAuthors: idOnly.slice(0, 8).map((r) => r.author),
      floors: [idOnly[0].floor, idOnly[idOnly.length - 1].floor],
    })
  }
  if (noise.length) {
    buckets.push({
      kind: 'noise',
      count: noise.length,
      sampleAuthors: noise.slice(0, 8).map((r) => r.author),
      floors: [noise[0].floor, noise[noise.length - 1].floor],
    })
  }

  return {
    sections,
    buckets,
    stats: {
      total,
      kept: sections.length,
      idOnly: idOnly.length,
      noise: noise.length,
      dupCollapsed,
    },
  }
}

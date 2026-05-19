import { ofetch } from 'ofetch'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { loadConfig } from '../lib/config.mjs'
import { emit, table, trunc, relTime } from '../lib/output.mjs'

// SOV2EX is a community-run search index for V2EX. V2EX itself ships no
// official search API. See https://www.sov2ex.com/.
const SOV2EX = 'https://www.sov2ex.com/api/search'

export function registerSearch(program) {
  program
    .command('search <keyword...>')
    .description('search topics via SOV2EX (third-party). multiple words = AND.')
    .option('-s, --size <n>', 'results per page (1-50)', '20')
    .option('-f, --from <n>', 'offset (for paging)', '0')
    .option('--sort <mode>', 'created | sumup (relevance, default)', 'sumup')
    .option('--node <id>', 'restrict to a node id (numeric)')
    .option('--user <username>', 'restrict to a username')
    .action(async (kw, opts, cmd) => {
      const cfg = loadConfig()
      const params = new URLSearchParams({
        q: kw.join(' '),
        size: String(Math.min(50, Math.max(1, Number(opts.size) || 20))),
        from: String(Math.max(0, Number(opts.from) || 0)),
        sort: opts.sort === 'created' ? 'created' : 'sumup',
      })
      if (opts.node) params.set('node', String(opts.node))
      if (opts.user) params.set('username', opts.user)

      const fetchOpts = { retry: 0 }
      if (cfg.proxy) fetchOpts.agent = new HttpsProxyAgent(cfg.proxy)

      let data
      try {
        data = await ofetch(`${SOV2EX}?${params}`, fetchOpts)
      } catch (err) {
        const status = err?.response?.status
        const msg = err?.data?.message || err?.message || String(err)
        process.stderr.write(`v2ex: search error${status ? ` ${status}` : ''}: ${msg}\n`)
        process.exit(1)
      }

      const hits = (data.hits || []).map((h) => {
        const s = h._source || {}
        return {
          id: s.id,
          title: s.title,
          replies: s.replies,
          author: s.member,
          node_id: s.node,
          created: Math.floor(new Date(s.created).getTime() / 1000) || null,
          score: h._score,
          url: `https://www.v2ex.com/t/${s.id}`,
          excerpt: trunc((s.content || '').replace(/\r/g, ''), 200),
        }
      })

      const out = {
        query: kw.join(' '),
        total: data.total ?? hits.length,
        from: Number(opts.from) || 0,
        size: hits.length,
        hits,
      }

      emit(cmd, out, (d) => {
        const head = `query=${d.query}\ttotal=${d.total}\tshown=${d.size}@${d.from}`
        if (!d.hits.length) return head + '\n(no results)'
        const body = table(d.hits.map((h) => [
          h.id,
          `r=${h.replies}`,
          h.created ? relTime(h.created) : '-',
          h.author,
          trunc(h.title, 70),
        ]))
        return head + '\n' + body
      })
    })
}

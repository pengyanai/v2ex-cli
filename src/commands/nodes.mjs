import { api } from '../lib/client.mjs'
import { loadConfig } from '../lib/config.mjs'
import { DEFAULT_NODES } from '../lib/default-nodes.mjs'
import { emit, table, trunc } from '../lib/output.mjs'

export function registerNodes(program) {
  program
    .command('nodes [name]')
    .description('list curated nodes; with [name] fetches that node\'s metadata')
    .action(async (name, _opts, cmd) => {
      if (name) {
        const { result } = await api(`nodes/${encodeURIComponent(name)}`)
        const data = {
          name: result.name,
          title: result.title,
          topics: result.topics,
          stars: result.stars,
          header: result.header || '',
          url: result.url,
        }
        emit(cmd, data, (d) =>
          [
            `name\t${d.name}`,
            `title\t${d.title}`,
            `topics\t${d.topics}`,
            `stars\t${d.stars ?? '-'}`,
            `url\t${d.url}`,
            d.header ? `header\t${trunc(d.header, 200)}` : null,
          ].filter(Boolean).join('\n'),
        )
        return
      }
      const cfg = loadConfig()
      const fileNodes = cfg.nodes && Array.isArray(cfg.nodes) ? cfg.nodes : null
      const list = (fileNodes || DEFAULT_NODES).map((n) => ({
        name: n.name || n.code,
        title: n.title || n.name,
      }))
      emit(cmd, list, (rows) => table(rows.map((r) => [r.name, r.title])))
    })
}

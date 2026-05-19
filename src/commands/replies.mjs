import { api } from '../lib/client.mjs'
import { emit, table, trunc, relTime } from '../lib/output.mjs'

export function registerReplies(program) {
  program
    .command('replies <topicId>')
    .description('list replies of a topic')
    .option('-p, --page <n>', 'page number', '1')
    .option('-l, --limit <n>', 'cap output rows')
    .action(async (id, opts, cmd) => {
      const page = Number(opts.page) || 1
      const { result } = await api(`topics/${encodeURIComponent(id)}/replies?p=${page}`)
      let list = (result || []).map((r, i) => ({
        floor: (page - 1) * 100 + i + 1,
        id: r.id,
        author: r.member?.username,
        created: r.created,
        content: (r.content || '').replace(/\r/g, ''),
      }))
      if (opts.limit) list = list.slice(0, Number(opts.limit))
      emit(cmd, list, (rows) =>
        rows.map((r) =>
          `#${r.floor}\t${r.author}\t${relTime(r.created)}\t${trunc(r.content, 200)}`,
        ).join('\n'),
      )
    })
}

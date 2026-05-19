import { apiV1 } from '../lib/client.mjs'
import { emit, table, trunc, relTime } from '../lib/output.mjs'

export function registerTopics(program) {
  program
    .command('topics <node>')
    .description('list topics under a node (e.g. qna, programmer, openai). public, no auth.')
    .option('-p, --page <n>', 'page number', '1')
    .option('-l, --limit <n>', 'cap output rows')
    .action(async (node, opts, cmd) => {
      const result = await apiV1(`topics/show.json?node_name=${encodeURIComponent(node)}&p=${Number(opts.page) || 1}`)
      let list = (result || []).map((t) => ({
        id: t.id,
        title: t.title,
        replies: t.replies,
        author: t.member?.username,
        created: t.created,
        last_touched: t.last_touched,
      }))
      if (opts.limit) list = list.slice(0, Number(opts.limit))
      emit(cmd, list, (rows) =>
        table(rows.map((r) => [
          r.id,
          `r=${r.replies}`,
          relTime(r.last_touched || r.created),
          trunc(r.title, 80),
        ])),
      )
    })
}

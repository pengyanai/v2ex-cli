import { apiV1 } from '../lib/client.mjs'
import { emit, table, trunc, relTime } from '../lib/output.mjs'

export function registerLatest(program) {
  program
    .command('latest')
    .description('latest topics across the site')
    .option('-l, --limit <n>', 'cap output rows')
    .action(async (opts, cmd) => {
      const result = await apiV1('topics/latest.json')
      let list = (result || []).map((t) => ({
        id: t.id,
        title: t.title,
        replies: t.replies,
        author: t.member?.username,
        node: t.node?.name,
        created: t.created,
        last_touched: t.last_touched,
      }))
      if (opts.limit) list = list.slice(0, Number(opts.limit))
      emit(cmd, list, (rows) =>
        table(rows.map((r) => [
          r.id,
          `r=${r.replies}`,
          r.node,
          relTime(r.last_touched || r.created),
          trunc(r.title, 70),
        ])),
      )
    })
}

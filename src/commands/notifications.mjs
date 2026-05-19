import { api } from '../lib/client.mjs'
import { emit, trunc, relTime } from '../lib/output.mjs'

export function registerNotifications(program) {
  program
    .command('notifications')
    .alias('notif')
    .description('list your notifications (auth required)')
    .option('-p, --page <n>', 'page number', '1')
    .option('-l, --limit <n>', 'cap output rows')
    .action(async (opts, cmd) => {
      const { result } = await api(`notifications?p=${Number(opts.page) || 1}`)
      let list = (result || []).map((n) => ({
        id: n.id,
        from: n.member?.username,
        topic_id: n.topic?.id,
        topic_title: n.topic?.title,
        text: (n.text || '').replace(/<[^>]+>/g, ''),
        payload: (n.payload || '').replace(/\r/g, ''),
        created: n.created,
      }))
      if (opts.limit) list = list.slice(0, Number(opts.limit))
      emit(cmd, list, (rows) =>
        rows.map((n) =>
          `${n.id}\t${n.from}\t${relTime(n.created)}\t#${n.topic_id}\t${trunc(n.text + (n.payload ? ' :: ' + n.payload : ''), 120)}`,
        ).join('\n'),
      )
    })
}

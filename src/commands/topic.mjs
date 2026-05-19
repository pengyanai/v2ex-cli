import { api } from '../lib/client.mjs'
import { emit, relTime, trunc } from '../lib/output.mjs'

export function registerTopic(program) {
  program
    .command('topic <id>')
    .description('show a topic: title, author, node, body, optional replies')
    .option('--with-replies', 'include first page of replies inline')
    .option('-p, --replies-page <n>', 'replies page when --with-replies', '1')
    .action(async (id, opts, cmd) => {
      const { result } = await api(`topics/${encodeURIComponent(id)}`)
      const out = {
        id: result.id,
        title: result.title,
        url: result.url,
        author: result.member?.username,
        node: result.node?.name,
        node_title: result.node?.title,
        replies: result.replies,
        created: result.created,
        last_touched: result.last_touched,
        content: (result.content || '').replace(/\r/g, ''),
      }
      if (opts.withReplies) {
        const { result: rs } = await api(`topics/${encodeURIComponent(id)}/replies?p=${Number(opts.repliesPage) || 1}`)
        out.replies_list = (rs || []).map((r, i) => ({
          floor: (Number(opts.repliesPage) - 1) * 100 + i + 1,
          author: r.member?.username,
          created: r.created,
          content: (r.content || '').replace(/\r/g, ''),
        }))
      }
      emit(cmd, out, (d) => {
        const head = [
          `id\t${d.id}`,
          `title\t${d.title}`,
          `author\t${d.author}`,
          `node\t${d.node}\t${d.node_title}`,
          `replies\t${d.replies}`,
          `created\t${relTime(d.created)} ago`,
          `url\t${d.url}`,
          '',
          d.content,
        ].join('\n')
        if (!d.replies_list) return head
        const tail = d.replies_list.map((r) =>
          `\n--- #${r.floor} ${r.author} (${relTime(r.created)} ago) ---\n${trunc(r.content, 1000)}`,
        ).join('\n')
        return head + '\n' + tail
      })
    })
}

import { apiV1 } from '../lib/client.mjs'
import { emit, relTime, trunc } from '../lib/output.mjs'
import { collapseReplies } from '../lib/collapse.mjs'

export function registerTopic(program) {
  program
    .command('topic <id>')
    .description('show a topic: title, author, node, body, optional replies. public, no auth.')
    .option('-r, --with-replies', 'include first page of replies inline')
    .option('-p, --replies-page <n>', 'replies page when --with-replies', '1')
    .option('--no-collapse', 'do not collapse duplicate / ID-only / short-noise replies')
    .action(async (id, opts, cmd) => {
      const arr = await apiV1(`topics/show.json?id=${encodeURIComponent(id)}`)
      const result = Array.isArray(arr) ? arr[0] : arr
      if (!result) {
        process.stderr.write(`v2ex: topic ${id} not found\n`)
        process.exit(1)
      }
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
        const rs = await apiV1(`replies/show.json?topic_id=${encodeURIComponent(id)}&p=${Number(opts.repliesPage) || 1}`)
        out.replies_list = (rs || []).map((r, i) => ({
          floor: (Number(opts.repliesPage) - 1) * 100 + i + 1,
          author: r.member?.username,
          created: r.created,
          content: (r.content || '').replace(/\r/g, ''),
        }))
      }
      emit(cmd, out, (d) => {
        const lines = []
        // Compact header — one fact per line, no padding noise
        lines.push(`# ${d.title}`)
        lines.push(`@${d.author}  ·  ${d.node}/${d.node_title}  ·  ${d.replies} replies  ·  ${relTime(d.created)} ago`)
        lines.push(d.url)
        lines.push('')
        lines.push(d.content)

        if (d.replies_list) {
          lines.push('')
          lines.push('─── replies ───')
          if (opts.collapse !== false) {
            const { sections, buckets, stats } = collapseReplies(d.replies_list)
            for (const s of sections) {
              lines.push('')
              const dupTag = s.dupCount
                ? `  [+${s.dupCount} similar: ${s.dupAuthors.join(', ')}${s.dupCount > s.dupAuthors.length ? ', …' : ''}]`
                : ''
              lines.push(`#${s.floor} @${s.author} · ${relTime(s.created)} ago${dupTag}`)
              lines.push(trunc(s.content, 1000))
            }
            for (const b of buckets) {
              lines.push('')
              const label = b.kind === 'id-only' ? 'ID-only replies' : 'noise / short replies'
              const range = b.floors[0] === b.floors[1] ? `#${b.floors[0]}` : `#${b.floors[0]}–#${b.floors[1]}`
              lines.push(`… ${b.count} ${label} (${range}): ${b.sampleAuthors.join(', ')}${b.count > b.sampleAuthors.length ? ', …' : ''}`)
            }
            lines.push('')
            lines.push(`─── ${stats.kept} shown · ${stats.dupCollapsed} dup · ${stats.idOnly} id-only · ${stats.noise} noise · ${stats.total} total ───`)
          } else {
            for (const r of d.replies_list) {
              lines.push('')
              lines.push(`#${r.floor} @${r.author} · ${relTime(r.created)} ago`)
              lines.push(trunc(r.content, 1000))
            }
          }
        }
        return lines.join('\n')
      })
    })
}

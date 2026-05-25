import { api, apiV1 } from '../lib/client.mjs'
import { emit, relTime } from '../lib/output.mjs'

export function registerMember(program) {
  program
    .command('user [username]')
    .alias('member')
    .description('show member profile (own if username omitted)')
    .action(async (username, _opts, cmd) => {
      let m
      if (!username) {
        const { result } = await api('member')
        m = result
      } else {
        m = await apiV1(`members/show.json?username=${encodeURIComponent(username)}`)
      }
      const out = {
        id: m.id,
        username: m.username,
        url: m.url,
        github: m.github || null,
        twitter: m.twitter || null,
        website: m.website || null,
        location: m.location || null,
        tagline: m.tagline || null,
        created: m.created,
        bio: (m.bio || '').replace(/\r/g, ''),
      }
      emit(cmd, out, (d) =>
        [
          `id\t${d.id}`,
          `username\t${d.username}`,
          `url\t${d.url}`,
          `since\t${relTime(d.created)} ago`,
          d.location ? `location\t${d.location}` : null,
          d.tagline ? `tagline\t${d.tagline}` : null,
          d.github ? `github\t${d.github}` : null,
          d.twitter ? `twitter\t${d.twitter}` : null,
          d.website ? `website\t${d.website}` : null,
          d.bio ? `\n${d.bio}` : null,
        ].filter(Boolean).join('\n'),
      )
    })
}

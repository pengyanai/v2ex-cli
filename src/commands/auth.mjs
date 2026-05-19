import { api } from '../lib/client.mjs'
import { loadConfig } from '../lib/config.mjs'
import { emit } from '../lib/output.mjs'

export function registerAuth(program) {
  program
    .command('auth')
    .description('verify V2EX token; prints authenticated user on success')
    .action(async (_opts, cmd) => {
      const cfg = loadConfig()
      if (!cfg.token) {
        process.stderr.write('v2ex: no token configured (set V2EX_TOKEN or ~/.v2ex.json)\n')
        process.exit(2)
      }
      const { result } = await api('member')
      emit(cmd, {
        ok: true,
        username: result.username,
        id: result.id,
        proxy: cfg.proxy || null,
      }, (d) => `ok\t${d.username}\tid=${d.id}\tproxy=${d.proxy || 'none'}`)
    })
}

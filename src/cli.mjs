import { Command } from 'commander'
import { registerAuth } from './commands/auth.mjs'
import { registerNodes } from './commands/nodes.mjs'
import { registerTopics } from './commands/topics.mjs'
import { registerTopic } from './commands/topic.mjs'
import { registerReplies } from './commands/replies.mjs'
import { registerHot } from './commands/hot.mjs'
import { registerLatest } from './commands/latest.mjs'
import { registerMember } from './commands/member.mjs'
import { registerNotifications } from './commands/notifications.mjs'
import { registerSearch } from './commands/search.mjs'

export async function run(argv) {
  const program = new Command()
  program
    .name('v2ex')
    .description('AI-agent friendly CLI for V2EX. Dense, scriptable, JSON-first.')
    .version('0.4.0')
    .option('--json', 'output JSON (machine-readable)')
    .option('--no-color', 'disable ANSI colors')

  registerAuth(program)
  registerNodes(program)
  registerTopics(program)
  registerTopic(program)
  registerReplies(program)
  registerHot(program)
  registerLatest(program)
  registerMember(program)
  registerNotifications(program)
  registerSearch(program)

  await program.parseAsync(argv)
}

import { Command } from 'commander'
import { registerAuth } from './commands/auth.mjs'
import { registerNodes } from './commands/nodes.mjs'
import { registerTopics } from './commands/topics.mjs'
import { registerTopic } from './commands/topic.mjs'
import { registerReplies } from './commands/replies.mjs'

export async function run(argv) {
  const program = new Command()
  program
    .name('v2ex')
    .description('AI-agent friendly CLI for V2EX. Dense, scriptable, JSON-first.')
    .version('0.1.0')
    .option('--json', 'output JSON (machine-readable)')
    .option('--no-color', 'disable ANSI colors')

  registerAuth(program)
  registerNodes(program)
  registerTopics(program)
  registerTopic(program)
  registerReplies(program)

  await program.parseAsync(argv)
}

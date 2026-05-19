import { Command } from 'commander'

export async function run(argv) {
  const program = new Command()
  program
    .name('v2ex')
    .description('AI-agent friendly CLI for V2EX. Dense, scriptable, JSON-first.')
    .version('0.1.0')
    .option('--json', 'output JSON (machine-readable)')
    .option('--no-color', 'disable ANSI colors')

  await program.parseAsync(argv)
}

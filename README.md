# v2ex-cli

AI-agent friendly CLI for [V2EX](https://v2ex.com). Dense, scriptable, JSON-first.

## Why

Existing V2EX terminal clients are interactive TUIs — great for humans, hostile to LLM tool-use. `v2ex-cli` is the opposite: every subcommand is non-interactive, exits with a clear status code, and emits either dense plain text (default) or JSON (`--json`) so an agent can pipe it into `jq` and reason about the result.

## Status

Bootstrapping. Tracking via [issues](https://github.com/pengyanai/v2ex-cli/issues).

## Install

```sh
npm install -g v2ex-cli
```

## Auth

```sh
export V2EX_TOKEN=...   # https://www.v2ex.com/settings/tokens
v2ex --version
```

Or `~/.v2ex.json`:

```json
{ "token": "...", "proxy": "http://127.0.0.1:7890" }
```

## License

MIT

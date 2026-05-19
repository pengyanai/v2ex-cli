# v2ex-cli

[![npm](https://img.shields.io/npm/v/@pengyanai/v2ex-cli?logo=npm)](https://www.npmjs.com/package/@pengyanai/v2ex-cli)
[![GitHub release](https://img.shields.io/github/v/release/pengyanai/v2ex-cli?display_name=tag&sort=semver)](https://github.com/pengyanai/v2ex-cli/releases/latest)
[![Release date](https://img.shields.io/github/release-date/pengyanai/v2ex-cli)](https://github.com/pengyanai/v2ex-cli/releases/latest)
[![License: MIT](https://img.shields.io/github/license/pengyanai/v2ex-cli)](./LICENSE)

AI-agent friendly CLI for [V2EX](https://v2ex.com). Dense, scriptable, JSON-first.

```sh
npm install -g @pengyanai/v2ex-cli
export V2EX_TOKEN=...   # https://www.v2ex.com/settings/tokens
v2ex hot --limit 5
```

## Why

Existing V2EX terminal clients are interactive TUIs — great for humans, hostile to LLM tool use. `v2ex-cli` inverts that: every subcommand is non-interactive, fails with a stable exit code, and emits either dense plain text (default) or JSON (`--json`) so an agent can pipe it into `jq` and reason about the result.

Design rules:

- **Single shot**: one command, one network call (or the minimum needed), one exit.
- **High info density**: TSV-shaped default output. No boxes, no spinners, no colors-by-default.
- **JSON on demand**: top-level `--json` flips every command into structured mode with stable keys.
- **Deterministic exit codes**: `0` ok · `1` API/network error · `2` missing/invalid auth.

## Install

```sh
npm install -g @pengyanai/v2ex-cli
# or run without install
npx @pengyanai/v2ex-cli hot
```

Node.js ≥ 18 required.

## Auth

Get a token at <https://www.v2ex.com/settings/tokens>, then either:

```sh
export V2EX_TOKEN=xxxxxxxx
```

or `~/.v2ex.json`:

```json
{
  "token": "xxxxxxxx",
  "proxy": "http://127.0.0.1:7890",
  "nodes": [{ "name": "openai", "title": "OpenAI" }]
}
```

`HTTPS_PROXY` / `http_proxy` env vars are also honored.

Verify: `v2ex auth` (exit 0 = ok, exit 2 = bad token).

## Commands

| Command | Auth | Purpose |
|---|---|---|
| `v2ex auth` | yes | verify token, print authenticated user |
| `v2ex nodes [name]` | mixed | list curated nodes; with name → fetch node metadata |
| `v2ex topics <node>` | yes | topics under a node, paginated |
| `v2ex topic <id> [--with-replies]` | yes | topic body + meta, optionally inline first replies page |
| `v2ex replies <topicId>` | yes | replies of a topic, floor-numbered |
| `v2ex hot [--limit N]` | no | front-page hot topics |
| `v2ex latest [--limit N]` | no | latest topics across the site |
| `v2ex member [username]` | yes | profile (own if username omitted) |
| `v2ex notifications` | yes | your notifications |

Universal flags: `--json`, `--no-color`, `-V`/`--version`, `-h`/`--help`. Per-command: `-p/--page`, `-l/--limit` where applicable.

## Examples for AI agents

Top 5 hot titles only:

```sh
v2ex hot --json --limit 5 | jq -r '.[].title'
```

Find unanswered "问与答" topics:

```sh
v2ex topics qna --json | jq '[.[] | select(.replies == 0)]'
```

Read a topic with replies in one call:

```sh
v2ex topic 1213548 --with-replies --json | jq '{title, replies, first_reply: .replies_list[0].content}'
```

Pipeline-friendly: every text mode is TSV, so `awk -F'\t'` works directly.

```sh
v2ex hot --limit 10 | awk -F'\t' '{print $1, $2}'
```

See [`docs/AGENT_USAGE.md`](docs/AGENT_USAGE.md) for tool-use schemas and longer recipes.

## Project notes

- Uses V2EX v2 API where it covers the use case (auth, node metadata, node topics, topic, replies, member, notifications).
- Uses V2EX v1 (`/api/topics/hot.json`, `/api/topics/latest.json`, `/api/members/show.json`) for endpoints v2 doesn't expose. Both share the same token + proxy config.
- No public list-all-nodes endpoint exists; `v2ex nodes` ships a curated set, override via the `nodes` key in `~/.v2ex.json`.

The full origin prompt and iteration log lives in [`docs/PROMPTS.md`](docs/PROMPTS.md).

## Status

Tracking via [issues](https://github.com/pengyanai/v2ex-cli/issues). Forked from [`v2erminal`](https://github.com/yuyinws/v2erminal) and rewritten end-to-end.

## License

MIT

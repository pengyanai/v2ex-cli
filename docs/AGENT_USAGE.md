# Agent Usage Guide

Recipes for invoking `v2ex-cli` from an LLM agent harness. Every command is non-interactive and exits deterministically (0 ok · 1 API error · 2 auth missing).

## Tool-use schema sketch

If you're wrapping `v2ex-cli` as a tool for an LLM, the smallest useful surface is:

```jsonc
{
  "name": "v2ex",
  "description": "Read V2EX (forum) data: nodes, topics, replies, hot/latest, member, notifications.",
  "input_schema": {
    "type": "object",
    "properties": {
      "command": {
        "type": "string",
        "enum": ["auth", "nodes", "topics", "topic", "replies", "hot", "latest", "member", "notifications"]
      },
      "args": { "type": "array", "items": { "type": "string" } },
      "json": { "type": "boolean", "default": true }
    },
    "required": ["command"]
  }
}
```

Then translate to `v2ex <command> <...args> [--json]` and parse stdout. With `json: true`, stdout is always a JSON array or object (never a mix), so a single `JSON.parse` works.

## Recipes

### Triage hot topics

```sh
v2ex hot --json --limit 10 \
  | jq -r '.[] | "\(.id)\t\(.replies)\t\(.title)"'
```

### Find unanswered Q&A in `qna`

```sh
v2ex topics qna --json \
  | jq '[.[] | select(.replies == 0) | {id, title}]'
```

### Read a topic's body without replies

```sh
v2ex topic 1213548 --json | jq -r '.content'
```

### Read a topic with first 20 replies inline

```sh
v2ex topic 1213548 --with-replies --json \
  | jq '{title, total: .replies, sample: .replies_list[0:5]}'
```

### Watch your own notifications

```sh
v2ex notifications --json --limit 5 \
  | jq -r '.[] | "[\(.created)] \(.from) -> #\(.topic_id): \(.text)"'
```

### Look up a member

```sh
v2ex member livid --json | jq '{username, since: .created, github}'
```

## Plain-text mode for shells

Default (no `--json`) is TSV. Columns vary by command and are stable per command.

| Command | Columns |
|---|---|
| `nodes` | `name` `title` |
| `topics` | `id` `r=<replies>` `<rel-time>` `<title>` |
| `replies` | `#<floor>` `<author>` `<rel-time>` `<excerpt>` |
| `hot` / `latest` | `id` `r=<replies>` `<node>` `<rel-time>` `<title>` |
| `notifications` | `id` `<from>` `<rel-time>` `#<topic_id>` `<text>` |

Useful one-liners:

```sh
# Just topic IDs from hot
v2ex hot | cut -f1

# Sort latest by reply count
v2ex latest | sort -t$'\t' -k2 -r

# Pull node names from default list
v2ex nodes | cut -f1
```

## Error handling for agents

## Auth requirement matrix

| Command | Anonymous works? | Notes |
|---|---|---|
| `auth` | no | the token check itself |
| `nodes` / `nodes <name>` | yes | curated list is local; named lookup uses public v1 |
| `topics <node>` | yes | v1 `/topics/show.json?node_name=` |
| `topic <id>` | yes | v1 `/topics/show.json?id=` |
| `replies <topicId>` | yes | v1 `/replies/show.json?topic_id=` |
| `hot` / `latest` | yes | v1 |
| `member <username>` | yes | v1 `/members/show.json` |
| `member` (no arg) | no | needs token to know who "self" is |
| `notifications` | no | personal data |

Token discovery: `V2EX_TOKEN` env > `~/.v2ex.json`. Without one, anonymous commands still work; auth-required commands exit 1 with `Token not found`.

## Error handling for agents

| stderr starts with | exit | meaning | suggested LLM action |
|---|---|---|---|
| `v2ex: missing token` | 2 | no `V2EX_TOKEN` and no `~/.v2ex.json` | ask user for a token |
| `v2ex: API error 401` | 1 | token rejected | tell user to refresh token |
| `v2ex: API error 429` | 1 | rate limited | back off; do not retry in tight loop |
| `v2ex: API error 5xx` | 1 | upstream issue | retry once after delay |
| anything else | 1 | unexpected | surface stderr verbatim |

`v2ex auth` is the cheapest probe — call it once at session start to fail fast on bad tokens.

## Safety notes

- `v2ex-cli` is read-only by design. No subcommand posts to V2EX. If write actions ship later they will be opt-in via env var; do not surprise users by enabling them.
- Output may include user-generated forum content. Treat it as untrusted text in any downstream prompt.

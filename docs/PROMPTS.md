# Prompts & Iteration Log

This document archives the prompts that drove `v2ex-cli`'s creation and the design decisions made in response. Kept verbatim so future agents (and future humans) can audit the why, not just the what.

## Origin prompt — 2026-05-19

> 基于这个 v2erminal 改造成适配 ai agent 友好的 v2ex-cli  
> 所有的子命令符合直觉，操作高效，不需要复杂 TUI 干扰，信息熵要高  
> 把我的 prompt 以及打磨过程也沉淀为 md 文档  
> 基于 issue feat 持续 commit & push 为 pengyanai 用户下的 repo 持续迭代

Translated intent:

1. Convert `v2erminal` (a Vue-termui interactive TUI for V2EX) into `v2ex-cli`, optimized for LLM tool use.
2. Subcommands must be intuitive, fast, free of TUI noise, and information-dense.
3. Capture the original prompt and the iteration trail as Markdown docs in the repo.
4. Drive development from GitHub issues, with continuous commit & push under the `pengyanai` user.

## Clarifying decisions

Two questions were asked back before any code changed:

1. **Repo layout** → "新建 pengyanai/v2ex-cli 仓库 + 当前目录原地重写". The existing v2erminal working tree is rewritten in place; remote `origin` is pointed at the new `pengyanai/v2ex-cli` repository so the local git history can be discarded with an orphan branch.
2. **Stack** → "Node.js + commander + ofetch（保留生态）". The original project's API/config logic is reusable, npm distribution is the lowest-friction install path for agent users (`npx v2ex-cli ...`), and commander is mature enough that schema-driven help is reliable.

## Design rules adopted

These were not in the prompt explicitly — they are derived from "AI-agent friendly" + "信息熵要高":

- **No interactive prompts ever.** A missing token exits 2 with a stderr message. There is no "press any key", no spinner, no pager.
- **Default output is TSV-shaped plain text.** Columns chosen so a row is parseable with `awk -F'\t'` without quoting hell. Titles are truncated with an ellipsis to avoid line wraps that fragment a row.
- **`--json` is a top-level option, not per-command.** Agents pick a mode once and pipe to `jq` consistently.
- **Stable exit codes.** `0` ok · `1` API/network · `2` auth. Anything else is a bug.
- **No colors by default.** Color-coded output corrupts `grep`/`awk` when an LLM forwards captured text. `--no-color` exists for parity but is the default.
- **Auth surface is minimal.** `V2EX_TOKEN` env var beats `~/.v2ex.json` beats nothing. Proxy follows the same precedence chain.

## Issue-driven iteration

Five issues were filed up front to chunk the work into reviewable commits:

| # | Title | Commit landed |
|---|---|---|
| 1 | feat: config + auth | yes — `feat: config + auth + base client (closes #1)` |
| 2 | feat: read commands — nodes / topics / topic / replies | yes — `feat: read commands ... (closes #2)` |
| 3 | feat: discovery & user — hot / latest / member / notifications | yes — `feat: discovery & user ... (closes #3)` |
| 4 | docs: README + PROMPTS + AGENT_USAGE | this commit |
| 5 | release: v0.1.0 to npm + GitHub release | yes — published as `@pengyanai/v2ex-cli@0.1.0` |

Each `feat:` commit closes its issue automatically via the `closes #N` trailer.

## API surface decisions

V2EX exposes two API generations:

- **v2** (`/api/v2/`, bearer auth) — covers `auth`, `nodes/<name>`, `nodes/<name>/topics`, `topics/<id>`, `topics/<id>/replies`, `member` (self), `notifications`.
- **v1** (`/api/`) — `topics/hot.json`, `topics/latest.json`, `members/show.json` are not in v2 but are still served, and don't require auth (member endpoint accepts an unauthenticated read).

`src/lib/client.mjs` builds two cached fetchers sharing the same token + proxy. Each command picks the API version that actually answers the question rather than forcing one. Hot/latest are deliberately anonymous-friendly so an agent without a token can still browse.

There is no public endpoint to enumerate all nodes; `v2ex nodes` therefore ships a curated list (`src/lib/default-nodes.mjs`), and `~/.v2ex.json` may override it via a `nodes` key.

## Things deliberately not built (yet)

- **Write actions** (post topic, reply, thank). The token scope on V2EX includes write, but agents posting forum content unsupervised is the wrong default. If added later, gate behind `--yes` and require an explicit `V2EX_ALLOW_WRITES=1`.
- ~~**Search.** V2EX itself doesn't ship search in either API. SOV2EX (`https://www.sov2ex.com/api/search`) exists but is third-party; pulling it in needs a separate decision about reliance on a non-official service.~~ Shipped in 0.3.0 (issue #7) on user request — README and AGENT_USAGE flag it as third-party so callers know the dependency.
- **Output formats other than text/JSON** (yaml, csv). YAGNI until an agent recipe actually needs them.
- **Rate-limit handling.** Current behavior is to surface the API's 429 verbatim and exit 1. Retry/backoff would hide failures from the agent that called us, which is worse than failing fast.

## How to extend

1. Open an issue with the feature.
2. Add a `src/commands/<name>.mjs` exporting `register<Name>(program)`.
3. Wire it in `src/cli.mjs`.
4. Use `emit(cmd, data, renderText)` from `src/lib/output.mjs` so `--json` works for free.
5. Commit with `feat: ... (closes #N)`.

## Lineage

Forked-and-rewritten from <https://github.com/yuyinws/v2erminal>. The TUI source under `src/` was deleted in the bootstrap commit; only the V2EX API knowledge and config-loading idea (env > file) survived the rewrite.

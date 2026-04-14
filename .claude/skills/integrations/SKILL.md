---
name: integrations
description: Discover and execute third-party integrations via connected platforms. Use when the user wants to interact with external services like Gmail, Slack, Stripe, or any connected platform.
allowed-tools: "Bash,Read,Glob"
---

# Integrations

Discover connected platforms, search for available actions, and execute API calls through connected integrations.

**Authentication**: Handled automatically. No login required.

## Available Commands

```bash
bun schema0 integrations connections                           # List connected platforms
bun schema0 integrations connections --platform gmail          # Filter by platform
bun schema0 integrations search <platform> "<query>"           # Search actions (natural language)
bun schema0 integrations details <systemId>                    # Get action parameters and knowledge
bun schema0 integrations execute <connectionKey> <path> [opts] # Execute an action
```

## Typical Workflow

```bash
# 1. See what platforms are connected
bun schema0 integrations connections

# 2. Search for actions using natural language
bun schema0 integrations search hacker-news "get top stories"
bun schema0 integrations search gmail "send email"
bun schema0 integrations search slack "send message"

# 3. Get details about a specific action (parameters, docs)
bun schema0 integrations details <systemId>

# 4. Execute the action
bun schema0 integrations execute <connectionKey> /v0/topstories.json --method GET --action-id <systemId>
```

## Key Concepts

- **Connection key**: Identifies which authenticated platform account to use (from `connections` output)
- **System ID**: Unique identifier for an action (from `search` output)
- **Search query**: Natural language description of what you want to do (e.g. "send email", "list users")
- **Action path**: The API path for the passthrough request (from `search` or `details` output)

## Notes

- The `search` query is natural language — describe the action you want in plain English
- Always run `details` before `execute` to understand required parameters
- Path parameters use `{{param}}` or `:param` format and are substituted automatically via `--path-params`
- All commands are non-interactive and suitable for automated use

See command references in `references/`:

- [connections.md](references/connections.md) — `integrations connections`
- [search.md](references/search.md) — `integrations search`
- [details.md](references/details.md) — `integrations details`
- [execute.md](references/execute.md) — `integrations execute`

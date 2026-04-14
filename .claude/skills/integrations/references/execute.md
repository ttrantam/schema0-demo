# bun schema0 integrations execute

Execute an action on a connected platform.

## Usage

```bash
bun schema0 integrations execute <platform> <actionPath> [options]
```

## Arguments

| Argument       | Description                                  | Required |
| -------------- | -------------------------------------------- | -------- |
| `<platform>`   | Platform name (e.g. resend, gmail, slack)    | Yes      |
| `<actionPath>` | API path (from `search` or `details` output) | Yes      |

## Options

| Option                  | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `--action-id <id>`      | Action system ID for input validation                  |
| `--method <method>`     | HTTP method (default: POST)                            |
| `--data <json>`         | Request body as JSON string                            |
| `--path-params <json>`  | Path parameters as JSON (replaces `{{param}}` in path) |
| `--query-params <json>` | Query parameters as JSON                               |

## Examples

```bash
# Simple GET (no parameters)
bun schema0 integrations execute hacker-news /v0/topstories.json \
  --method GET \
  --action-id conn_mod_def::xyz789

# GET with path parameters
bun schema0 integrations execute hacker-news '/v0/item/{{itemId}}.json' \
  --method GET \
  --action-id conn_mod_def::xyz789 \
  --path-params '{"itemId":"8863"}'

# POST with body data
bun schema0 integrations execute resend /email/send \
  --method POST \
  --action-id conn_mod_def::xyz789 \
  --data '{"to":"user@example.com","subject":"Hello","body":"World"}'

# GET with query parameters
bun schema0 integrations execute hacker-news /v0/topstories.json \
  --method GET \
  --query-params '{"print":"pretty"}'
```

## Notes

- When `--action-id` is provided, the server validates input against the action's schema before executing
- Path parameters in `{{param}}` or `:param` format are automatically substituted from `--path-params`
- The result is printed as formatted JSON
- Connection keys are stored securely on the server — you only need the platform name

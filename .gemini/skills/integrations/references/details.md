# bun schema0 integrations details

Get detailed knowledge and parameter requirements for a specific action.

## Usage

```bash
bun schema0 integrations details <systemId>
```

## Arguments

| Argument     | Description                              | Required |
| ------------ | ---------------------------------------- | -------- |
| `<systemId>` | Action system ID (from `search` results) | Yes      |

## Output

```
bun schema0 integrations details conn_mod_def::abc123::xyz789
Fetching action details...
Details retrieved.
Get an Item
  GET /v0/item/{{itemId}}.json

  Path parameters:
    itemId: The item's unique ID

  Query parameters:
    print: If set to 'pretty', returns formatted JSON

  Knowledge:
  # Get an Item
  ...
```

## Notes

- Always run `details` before `execute` to understand what parameters the action requires
- Path parameters (shown as `{{param}}`) must be passed via `--path-params` in the `execute` command
- Query parameters are optional unless noted otherwise

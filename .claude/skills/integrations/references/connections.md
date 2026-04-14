# bun schema0 integrations connections

List all connected integration platforms for the current app.

## Usage

```bash
bun schema0 integrations connections [--platform <name>]
```

## Options

| Option       | Description                         |
| ------------ | ----------------------------------- |
| `--platform` | Filter connections by platform name |

## Output

```
bun schema0 integrations connections
Fetching connections...
Connections retrieved.
Found 2 connection(s):
  gmail  conn_abc123  (live)
  slack  conn_def456  (live)
```

## Notes

- The connection `key` is needed for the `execute` command
- The `platform` name is needed for the `search` command

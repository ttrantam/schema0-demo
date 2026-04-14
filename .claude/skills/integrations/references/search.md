# bun schema0 integrations search

Search for available actions on a connected platform using natural language.

## Usage

```bash
bun schema0 integrations search <platform> "<query>"
```

## Arguments

| Argument     | Description                                          | Required |
| ------------ | ---------------------------------------------------- | -------- |
| `<platform>` | Platform name (e.g. `gmail`, `slack`, `hacker-news`) | Yes      |
| `<query>`    | Natural language description (e.g. `"send email"`)   | Yes      |

## Output

```
bun schema0 integrations search gmail "send email"
Searching actions for gmail...
Actions retrieved.
Found 3 action(s):
  Send Email
    POST /messages/send
    ID: conn_mod_def::abc123::xyz789
  Reply to Thread
    POST /messages/reply
    ID: conn_mod_def::abc456::xyz012
  Send Draft
    POST /drafts/send
    ID: conn_mod_def::abc789::xyz345
```

## Notes

- The query is **natural language** — describe what you want to do in plain English
- The `ID` (systemId) is needed for the `details` and `execute` commands
- The `path` and `method` are needed for the `execute` command

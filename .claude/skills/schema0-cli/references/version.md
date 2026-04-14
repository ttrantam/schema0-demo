# Schema0 Version Management

Manage preview and production deployments.

A **preview** runs your new application code against a database branched from production, letting you test changes with the production schema before going live. If your code introduces schema changes, a migration is required before the preview is fully operational.

## schema0 version list

List all versions (dev deployments, previews, production).

```bash
schema0 version list
```

**Output** (JSON when non-interactive):

```json
{
  "developments": [
    {
      "commitHash": "abc1234",
      "query": "...",
      "deployStatus": "success",
      "createdAt": "..."
    }
  ],
  "previews": [
    {
      "commitHash": "abc1234",
      "url": "https://preview--abc1234.schema0.com",
      "migrationCompleted": true
    }
  ],
  "production": {
    "commitHash": "abc1234",
    "url": "https://production--appid.schema0.com"
  }
}
```

---

## schema0 version preview \<commitHash\>

Create a preview environment from a dev deployment.

```bash
schema0 version preview abc1234
```

| Argument       | Description                              | Required |
| -------------- | ---------------------------------------- | -------- |
| `<commitHash>` | Commit hash of the dev deployment to use | Yes      |

- Creates a database branch, copies secrets, and deploys the preview
- If migration is required, returns a schema diff — you must then run `confirm-migration` with your SQL statements

**Output** (JSON):

```json
{
  "success": true,
  "requiresMigration": false,
  "url": "https://preview--abc1234.schema0.com"
}
```

Or if migration is required:

```json
{ "success": true, "requiresMigration": true, "schemaDiff": "..." }
```

---

## schema0 version deploy \<commitHash\>

Deploy a preview to production.

```bash
schema0 version deploy abc1234
```

| Argument       | Description                          | Required |
| -------------- | ------------------------------------ | -------- |
| `<commitHash>` | Commit hash of the preview to deploy | Yes      |

- The preview must exist and have its migration completed (if applicable)
- If migration is required, returns a schema diff — run `confirm-migration --production` with your SQL

**Output** (JSON):

```json
{ "success": true, "url": "https://production--appid.schema0.com" }
```

Or if migration is required:

```json
{ "success": true, "requiresMigration": true, "schemaDiff": "..." }
```

---

## schema0 version confirm-migration \<commitHash\>

Apply migration statements to a preview or production environment.

```bash
# Preview migration
schema0 version confirm-migration abc1234 --statements "ALTER TABLE foo ADD COLUMN bar TEXT;" "CREATE INDEX idx_bar ON foo(bar);"

# Production migration
schema0 version confirm-migration abc1234 --production --statements "ALTER TABLE foo ADD COLUMN bar TEXT;"
```

| Argument/Option | Description                          | Required |
| --------------- | ------------------------------------ | -------- |
| `<commitHash>`  | Commit hash of the preview           | Yes      |
| `--statements`  | One or more SQL migration statements | Yes      |
| `--production`  | Target production instead of preview | No       |

- Each statement should be a complete SQL statement ending with `;`
- If migration fails, the response includes error details and suggested fix statements

**Output** (JSON):

```json
{ "success": true }
```

Or on failure:

```json
{ "success": false, "error": "...", "fixStatements": ["..."] }
```

---

## schema0 version remove \<commitHash\>

Remove a preview environment.

```bash
schema0 version remove abc1234
```

| Argument       | Description                          | Required |
| -------------- | ------------------------------------ | -------- |
| `<commitHash>` | Commit hash of the preview to remove | Yes      |

- Removes the deployed preview version and database branch

**Output** (JSON):

```json
{ "success": true }
```

---

## Typical Deployment Flow

```bash
# 1. Check current state
schema0 version list

# 2. Create preview from a dev deployment
schema0 version preview abc1234

# 3. If migration required, review the schema diff and apply SQL:
schema0 version confirm-migration abc1234 --statements "ALTER TABLE ...;"

# 4. Deploy preview to production
schema0 version deploy abc1234

# 5. If production migration required:
schema0 version confirm-migration abc1234 --production --statements "ALTER TABLE ...;"
```

## Notes

- Schema diffs are returned when migrations are needed — you write the SQL statements
- Preview must exist before deploying to production
- Migration must be completed before a preview can be promoted to production

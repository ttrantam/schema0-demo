# Schema0 Authentication (Sandbox)

Authentication is handled automatically by the environment.

## schema0 whoami

Show the currently authenticated identity.

```bash
schema0 whoami
```

**Authentication**: Automatic.

- Fetches identity info from the Schema0 backend (`GET /auth/whoami`)
- Displays organization info

**Output**:

```
schema0 whoami
Fetching user info...
User info retrieved.
Org: org_abc123
Done.
```

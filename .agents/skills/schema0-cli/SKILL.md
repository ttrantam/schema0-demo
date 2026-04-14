---
name: schema0-cli
description: Schema0 CLI commands for deployment, version management, and secrets management. Use when the user wants to deploy, manage versions (preview/production), or manage secrets.
allowed-tools: "Bash,Read,Glob"
---

# Schema0 CLI (Non-Interactive)

CLI for managing deployment, versions, and secrets. All commands run in non-interactive mode (no TTY prompts).

**Authentication**: Handled automatically. No login required.

**Unavailable commands**: `login`, `logout`, `init`, `setup`, `version` (interactive dashboard) — these require a TTY.

## Available Commands

```bash
schema0 whoami                          # Verify authentication
schema0 secrets list                    # List secret names
schema0 secrets set                     # Set secrets (KEY=VALUE or --env-file)
schema0 secrets delete                  # Delete a secret
schema0 dev                             # Start mobile dev server (Expo) — server must remain running
schema0 doctor                          # Check deployment readiness and fix configuration issues
schema0 deploy                          # Build & deploy (auto-detects platforms)
schema0 deploy --platform web           # Deploy web only
schema0 deploy --platform mobile        # Deploy mobile only
schema0 deploy --platform web,mobile    # Deploy both platforms
schema0 logs                            # View deployment logs
schema0 version list                    # List all versions (dev, preview, production)
schema0 version preview <commitHash>    # Create a preview environment
schema0 version deploy <commitHash>     # Deploy a preview to production
schema0 version remove <commitHash>     # Remove a preview environment
schema0 version confirm-migration <commitHash> --statements "SQL..." # Run migration
schema0 sync                            # Move local repository to Schema0
schema0 delete                          # Delete the app and all resources
```

## Sync

`schema0 sync` transfers your local repository to Schema0's platform. All branches and history are uploaded. Any previous work on Schema0 for this app will be replaced. After syncing, the app is accessible on the Schema0 dashboard.

## Typical Deployment Flow

```bash
schema0 doctor                    # Always run first — checks and fixes configuration issues
schema0 secrets set 'KEY=value'   # Set secrets (if needed)
schema0 deploy                    # Auto-detects and deploys all installed platforms
schema0 deploy --platform web     # Deploy only web
schema0 deploy --platform mobile  # Deploy only mobile
```

## Version Management Flow

```bash
schema0 version list                                    # Check current state
schema0 version preview <commitHash>                    # Create preview from a dev deployment
# If migration required, output includes schemaDiff — write SQL based on it:
schema0 version confirm-migration <commitHash> --statements "ALTER TABLE ...;" "CREATE INDEX ...;"
schema0 version deploy <commitHash>                     # Promote preview to production
# If production migration required:
schema0 version confirm-migration <commitHash> --production --statements "ALTER TABLE ...;"
schema0 version remove <commitHash>                     # Clean up preview
```

See command references in `references/`:

- [deploy.md](references/deploy.md) — `deploy`
- [secrets.md](references/secrets.md) — `secrets list`, `secrets set`, `secrets delete`
- [auth.md](references/auth.md) — `whoami`
- [version.md](references/version.md) — `version list`, `version preview`, `version deploy`, `version remove`, `version confirm-migration`

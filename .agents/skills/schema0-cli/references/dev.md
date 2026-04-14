# schema0 dev

Start the mobile development server (Expo) with a public tunnel URL.

## Usage

```bash
schema0 dev
```

## Behavior

Uses `node-pty` to spawn Expo with `--go` and `--tunnel` flags. The command outputs a QR code and a public tunnel URL.

The agent MUST display the QR code output to the user so they can scan it with Expo Go on their phone.

**Important:** The dev server must remain running — the app launched by scanning the QR code connects to it. If the server stops, the app will lose connection.

## Requirements

- Must be run from the project root (expects `apps/native/` to exist)
- Requires authentication (`schema0 whoami`)
- The API must be deployed first (`schema0 deploy --platform mobile`) — dev mode calls the deployed backend

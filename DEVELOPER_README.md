# Developer guide — wacli

Technical notes for building and contributing to this project. End users should start with [README.md](README.md).

## Requirements

- Node.js >= 16
- npm

## Setup

```bash
git clone https://github.com/Ad1tya-007/whatsapp-cli.git
cd whatsapp-cli
npm install
npm run build
```

### Run without installing globally

```bash
npm run dev -- list
npm run dev -- send -n 14165551234 -m "Hello"
```

Or via the helper script:

```bash
chmod +x wacli.sh
./wacli.sh list
```

### Link the `wacli` binary locally

```bash
npm run build
npm link
wacli --help
```

## Project structure

```
whatsapp-cli/
├── src/
│   ├── client.ts        # Client init, QR auth, connect/destroy, ~/.wacli session
│   ├── sendMessage.ts   # Send, list, contacts, check, me helpers
│   └── index.ts         # Commander CLI entry point
├── updates/             # Per-version release notes
├── DEPLOYMENT.md        # Publish checklist
├── package.json
└── tsconfig.json
```

## How it works

1. **whatsapp-web.js** drives a headless Chromium session against WhatsApp Web.
2. **LocalAuth** stores the session under `~/.wacli` (migrates legacy `./.wwebjs_auth` when present).
3. **qrcode-terminal** prints the QR code on first login.
4. **commander** defines CLI commands in `src/index.ts`.
5. Each command follows: `initializeClient` → `connectClient` → action → `destroyClient` → `process.exit`.

Phone numbers are resolved with `getNumberId()` (not hard-coded `number@c.us`) so LID / serialized IDs from current WhatsApp Web work correctly.

## Dependency note (whatsapp-web.js fork)

`package.json` pins:

```
whatsapp-web.js@github:lindionez/whatsapp-web.js#feat/fix-_serialized-id-fallback
```

WhatsApp Web renamed `_serialized` → `$1` on some ID objects. The fork adds a fallback until that lands in an official npm release. See [updates/v1.0.2.md](updates/v1.0.2.md).

## Why `list` does not use `getChats()`

`client.getChats()` / `getChatModel` still crash on some WhatsApp Web builds. `list` reads chat metadata via Puppeteer `page.evaluate` against WhatsApp Web’s Store (`WAWebCollections`), then sorts by timestamp and applies `--limit` (default 5).

## Session and logout

| Path | Role |
|------|------|
| `~/.wacli` | Current auth directory (`AUTH_PATH` in `client.ts`) |
| `./.wwebjs_auth` | Legacy path; migrated into `~/.wacli` when possible |

`logout` deletes local session files only. It does not call `client.logout()` on WhatsApp’s servers — remove the linked device on your phone if needed.

Stale Chrome `SingletonLock` files from unclean exits are cleared on init so the next command can start Chromium again.

## CLI commands (developer surface)

| Command | Implementation |
|---------|----------------|
| `send` | `sendMessage` / `sendMessageByName` — text and/or `MessageMedia.fromFilePath` |
| `list` | Store evaluate + `-l/--limit` |
| `contacts` | `client.getContacts()` |
| `check` | `client.getNumberId()` |
| `me` | `client.info` |
| `logout` | `fs.rmSync` on auth path |

Bump the version in both `package.json` and `program.version(...)` in `src/index.ts` when releasing. Add notes under `updates/`.

## Publishing

See [DEPLOYMENT.md](DEPLOYMENT.md).

## Release history

- [updates/v1.0.3.md](updates/v1.0.3.md) — contacts, check, me, media send, list limit, dual READMEs
- [updates/v1.0.2.md](updates/v1.0.2.md) — send/list reliability, `~/.wacli`, fork pin

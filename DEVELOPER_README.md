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
│   ├── index.ts              # CLI entry (shebang + parse)
│   ├── cli/
│   │   ├── program.ts        # Commander setup + version
│   │   ├── withClient.ts     # Shared connect → action → destroy → exit
│   │   └── commands/         # Per-command registration
│   ├── client/
│   │   ├── index.ts          # initialize / connect / destroy
│   │   ├── session.ts        # ~/.wacli auth path, migrate, locks
│   │   └── chrome.ts         # browser path + version helpers
│   ├── services/
│   │   ├── messaging.ts      # send by number / by contact
│   │   ├── contacts.ts       # saved-first resolve + picker + list
│   │   ├── media.ts          # file validation + supported media send
│   │   ├── chats.ts          # list chats (Store evaluate)
│   │   └── account.ts        # check + me
│   └── utils/
│       ├── phone.ts
│       └── ids.ts
├── updates/                  # Per-version release notes
├── DEPLOYMENT.md
├── package.json
└── tsconfig.json
```

## How it works

1. **whatsapp-web.js** drives a headless Chromium/Chrome session against WhatsApp Web.
2. **LocalAuth** stores the session under `~/.wacli` (migrates legacy `./.wwebjs_auth` when present).
3. **qrcode-terminal** prints the QR code on first login.
4. **commander** defines CLI commands under `src/cli/`.
5. Most commands use `withClient`: `initializeClient` → `connectClient` → action → `destroyClient` → `process.exit`.

Phone numbers are resolved with `getNumberId()` (not hard-coded `number@c.us`) so LID / serialized IDs from current WhatsApp Web work correctly.

### Contact resolution (`-c`)

1. Match saved contacts (`isMyContact` + saved `name` includes query; exact name preferred).
2. If none: collect up to 5 name/pushname matches and prompt with `@inquirer/select` (dynamic import; package is ESM-only).

### Media send (`-f`)

`services/media.ts` validates files before the WhatsApp client starts. Video extensions and `video/*` MIME types are rejected. Videos are not sent as playable media or as documents.

### Browser selection

Every command uses the same browser: system Chrome when present, otherwise puppeteer's bundled Chromium. All commands share the `~/.wacli/session` profile, and Chrome refuses a profile written by a newer build, so mixing browsers would break the session. `initializeClient` compares the profile's `Last Version` against the browser and fails fast with an actionable message instead of hanging for 30s.

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
| `~/.wacli` | Current auth directory (`AUTH_PATH` in `client/session.ts`) |
| `./.wwebjs_auth` | Legacy path; migrated into `~/.wacli` when possible |

`logout` deletes local session files only. It does not call `client.logout()` on WhatsApp’s servers — remove the linked device on your phone if needed.

Stale Chrome `SingletonLock` files from unclean exits are cleared on init so the next command can start Chromium again.

## CLI commands (developer surface)

| Command | Implementation |
|---------|----------------|
| `send` | `services/messaging` + `services/media` + contact resolve |
| `list` | `services/chats` Store evaluate + `-l/--limit` |
| `contacts` | `services/contacts` |
| `check` | `services/account` → `getNumberId()` |
| `me` | `services/account` → `client.info` |
| `logout` | `fs.rmSync` on auth path |

Bump the version in both `package.json` and `program.version(...)` in `src/cli/program.ts` when releasing. Add notes under `updates/`.

## Publishing

See [DEPLOYMENT.md](DEPLOYMENT.md).

## Release history

- [updates/v1.0.4.md](updates/v1.0.4.md) — saved-first `-c`, interactive picker, video rejection, src restructure
- [updates/v1.0.3.md](updates/v1.0.3.md) — contacts, check, me, media send, list limit, dual READMEs
- [updates/v1.0.2.md](updates/v1.0.2.md) — send/list reliability, `~/.wacli`, fork pin

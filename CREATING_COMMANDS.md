# Creating a wacli command

This guide walks through adding a new CLI command. End users should start with [README.md](README.md). Project setup is in [DEVELOPER_README.md](DEVELOPER_README.md).

You do **not** edit the argument parser or the registry. Drop a file in `src/cli/commands/` and it is picked up automatically.

```
wacli <command> [options]
        │
        ▼
  Command Registry (Map)
        │
        ▼
  your command.run(...)
        │
        ▼
  src/services/*  (WhatsApp logic)
```

Commands should stay small: parse/validate flags, call a service, print the result. Put WhatsApp work in `src/services/`, not in the command file.

---

## Step 1 — Choose a name

The command name is what users type after `wacli`.

| Rule | Example |
|------|---------|
| Lowercase, no spaces | `groups`, not `List Groups` |
| Same as the filename | `src/cli/commands/groups.ts` → `wacli groups` |
| Unique | Do not reuse `send`, `list`, `contacts`, `check`, `me`, or `logout` |

Check existing names:

```bash
npm run build
node dist/index.js --help
```

---

## Step 2 — Decide if WhatsApp must start

Most commands need a logged-in WhatsApp session (Chrome + QR on first run). A few do not.

| Kind | `needsClient` | When to use | Built-in example |
|------|---------------|-------------|------------------|
| WhatsApp command | omit, or `true` | Anything that talks to WhatsApp | `send`, `list`, `me` |
| Local command | `false` | Filesystem / config only — Chrome must not start | `logout` |

If you omit `needsClient`, the CLI connects, then calls `run(client, options)`. If you set `needsClient: false`, `run` is called with `client === null`.

---

## Step 3 — Create the file

Create **one file** in `src/cli/commands/`. Do not add an import in `program.ts` or `registry.ts`.

```bash
# from the repo root
touch src/cli/commands/status.ts
```

The registry loads every `.ts` / `.js` file in that folder (it skips `.d.ts` and source maps). The module must `export default` a command definition with `name` and `run`.

---

## Step 4 — Export a `CommandDefinition`

Start from this skeleton:

```ts
import type { CommandDefinition } from '../command';

const status: CommandDefinition = {
  name: 'status',
  description: 'Show whether WhatsApp is connected',
  failureLabel: 'read status',
  async run(client) {
    if (!client) {
      throw new Error('WhatsApp client is not available');
    }
    // Step 7: call a service or use client here
  },
};

export default status;
```

`name` and `description` show up in `wacli --help`. `failureLabel` is used in `❌ Failed to <label>:` if `run` throws after connect.

Always `export default` the object. Named exports are not registered.

---

## Step 5 — Add options (if the command takes flags)

Declare flags on the definition. Commander turns `--contact <name>` into `options.contact`.

```ts
type GroupsOptions = {
  limit: string;
};

const groups: CommandDefinition<GroupsOptions> = {
  name: 'groups',
  description: 'List WhatsApp groups',
  failureLabel: 'list groups',
  options: [
    {
      flags: '-l, --limit <n>',
      description: 'Number of groups to show',
      defaultValue: '10',
    },
  ],
  // validate + run...
};
```

| Field | Purpose |
|-------|---------|
| `flags` | Commander flag string, e.g. `-n, --number <number>` |
| `description` | Shown in `wacli <cmd> --help` |
| `required: true` | User must pass the flag (`check` uses this for `-n`) |
| `defaultValue` | Used when the flag is omitted (`list` uses `'5'`) |

Look at [src/cli/commands/send.ts](src/cli/commands/send.ts) for several optional flags, and [src/cli/commands/check.ts](src/cli/commands/check.ts) for one required flag.

---

## Step 6 — Validate before connecting

`validate` runs **before** Chrome starts. Use it for cheap checks: missing flags, bad numbers, unsupported files.

Throw an `Error`. The CLI prints `❌ Error: <message>` and exits without opening WhatsApp.

```ts
validate(options) {
  const limit = Number.parseInt(options.limit, 10);
  if (Number.isNaN(limit) || limit < 1) {
    throw new Error('--limit must be a positive number');
  }
},
```

Put file/media checks here too (see `send` and `assertMediaFileSupported`). Do not wait until `run` to reject a video — that would start the browser first.

---

## Step 7 — Implement `run`

`run` is the command body.

1. If this is a WhatsApp command, guard `client` (it is typed `Client | null`).
2. Call a function in `src/services/` — do not drive WhatsApp APIs from the command file.
3. Print user-facing output from the service (existing services already `console.log`).
4. Throw on failure; `withClient` prints `❌ Failed to <failureLabel>:`.

```ts
async run(client, options) {
  if (!client) {
    throw new Error('WhatsApp client is not available');
  }
  const limit = Number.parseInt(options.limit, 10);
  await listGroups(client, limit);
},
```

### New WhatsApp behavior belongs in a service

If no existing service does what you need, add a function under `src/services/` and import it from the command.

```ts
// src/services/groups.ts
import { Client } from 'whatsapp-web.js';

export async function listGroups(client: Client, limit: number): Promise<void> {
  // WhatsApp logic here
}
```

```ts
// src/cli/commands/groups.ts
import { listGroups } from '../../services/groups';
```

Existing services you can reuse:

| Service | Use for |
|---------|---------|
| `services/messaging.ts` | Send by number or contact name |
| `services/contacts.ts` | Resolve / list saved contacts |
| `services/media.ts` | File validation and media send |
| `services/chats.ts` | Recent chats |
| `services/account.ts` | Number check, logged-in account |

---

## Step 8 — Build and try it

The registry reads compiled files from `dist/cli/commands/`, so build after you add or change a command.

```bash
npm run build
node dist/index.js --help
node dist/index.js status --help
node dist/index.js status
```

You should see `status` in the help list with no other wiring.

If the command takes flags:

```bash
node dist/index.js groups --help
node dist/index.js groups -l 3
```

Confirm `validate` fails **before** “Initializing WhatsApp client…”:

```bash
node dist/index.js groups -l 0
# ❌ Error: --limit must be a positive number
```

---

## Worked example — `status`

A minimal WhatsApp command with no flags. Copy into `src/cli/commands/status.ts` if you want to try the flow, then delete the file if you do not want to keep it.

```ts
import type { CommandDefinition } from '../command';

const status: CommandDefinition = {
  name: 'status',
  description: 'Show whether WhatsApp is connected',
  failureLabel: 'read status',
  async run(client) {
    if (!client) {
      throw new Error('WhatsApp client is not available');
    }

    const name = client.info?.pushname || 'Unknown';
    console.log(`\n✅ WhatsApp is connected as ${name}\n`);
  },
};

export default status;
```

Then:

```bash
npm run build
node dist/index.js status
```

For a command with flags and `validate`, copy [src/cli/commands/list.ts](src/cli/commands/list.ts). For a command that must not start Chrome, copy [src/cli/commands/logout.ts](src/cli/commands/logout.ts).

---

## `CommandDefinition` fields

| Field | Required | Default | Meaning |
|-------|----------|---------|---------|
| `name` | yes | — | CLI name (`wacli <name>`) |
| `description` | yes | — | Help text |
| `run` | yes | — | `(client, options) => Promise<void>` |
| `options` | no | none | Flag list (see Step 5) |
| `validate` | no | skip | Sync checks before connect |
| `needsClient` | no | `true` | `false` = no Chrome / no session |
| `failureLabel` | no | `name` | Used in `Failed to <label>` |
| `finalizeMs` | no | `0` | Extra delay before teardown (`send` uses `500`) |

The type lives in [src/cli/command.ts](src/cli/command.ts).

---

## Checklist

- [ ] File is `src/cli/commands/<name>.ts`
- [ ] `export default` a definition whose `name` matches the filename
- [ ] `description` is set (shows up in `--help`)
- [ ] WhatsApp work is in `src/services/`, not in the command
- [ ] Cheap checks are in `validate`, not in `run`
- [ ] `needsClient: false` only if Chrome must not start
- [ ] You did **not** edit `src/cli/program.ts` or `src/cli/registry.ts`
- [ ] `npm run build` and `wacli <name> --help` work

---

## If something goes wrong

| Symptom | Likely cause |
|---------|----------------|
| Command missing from `--help` | File not in `src/cli/commands/`, or you skipped `npm run build` |
| `Invalid command module: …` | Missing `export default`, or no `name` / `run` |
| `Duplicate command: …` | Two files export the same `name` |
| Chrome starts, then flag error | Move the check into `validate` |
| `WhatsApp client is not available` | `needsClient: false` but `run` uses `client` |

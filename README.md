# WhatsApp CLI (`wacli`)

Send WhatsApp messages from your terminal using your personal WhatsApp account.

Developers: see [DEVELOPER_README.md](DEVELOPER_README.md).

## Install

You need [Node.js](https://nodejs.org/) (v16 or newer).

```bash
npm install -g @adityakul0314/wacli
```

Check that it works:

```bash
wacli --help
```

## First-time setup

The first time you run a command, a QR code appears in the terminal.

1. Open WhatsApp on your phone
2. Go to **Settings → Linked Devices → Link a Device**
3. Scan the QR code
4. Wait until you see that WhatsApp is ready

You only need to do this once. Your login is saved on this computer until you log out.

## Commands

### Send a text message

```bash
wacli send -n 14165551234 -m "Hello from CLI"
```

Use a saved contact name instead of a number:

```bash
wacli send -c "Mom" -m "Love you!"
```

`-c` looks in your **saved contacts** first. If nothing matches, you get an interactive list of up to 5 matches (name + number) — use the arrow keys and Enter to choose.

### Send a file

Send a supported file such as an image or document:

```bash
wacli send -n 14165551234 -f ./photo.jpg
```

Optional caption with `-m` when sending a file:

```bash
wacli send -c "Mom" -f ./photo.jpg -m "From today"
```

**Videos are not supported.** `wacli` rejects video files and will not send them as playable media or as documents.

### List recent chats

```bash
wacli list
```

Show more chats:

```bash
wacli list -l 10
```

### List contacts

```bash
wacli contacts
```

### Check a number

See if a phone number is on WhatsApp (does not send a message):

```bash
wacli check -n 14165551234
```

### Log in / who am I?

The first WhatsApp command prints a QR code if you are not logged in. `me` and `login` do the same thing:

```bash
wacli me
wacli login
```

### Log out

```bash
wacli logout
```

After logout, you will need to scan the QR code again next time.

## Phone numbers

Always include the country code, with no `+`, spaces, or dashes:

- US: `14165551234`
- UK: `447700900123`
- India: `919876543210`

## Troubleshooting

**QR code hard to scan** — Make the terminal window larger and try again.

**“Number not registered”** — Double-check the country code and remove spaces or punctuation.

**Video file rejected** — Video sending is intentionally unsupported, including sending a video as a document.

**Session problems** — Log out and run any command again to re-scan:

```bash
wacli logout
wacli me
```

**Your phone must stay online** — This uses WhatsApp Web, so your phone needs internet.

## License

MIT

## Disclaimer

This project is not affiliated with WhatsApp or Meta. Use responsibly and in accordance with WhatsApp’s Terms of Service.

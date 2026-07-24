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

### Send a file

```bash
wacli send -n 14165551234 -f ./photo.jpg
```

Optional caption:

```bash
wacli send -c "Mom" -f ./photo.jpg -m "From today"
```

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

### Who am I logged in as?

```bash
wacli me
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

# WhatsApp CLI — Quick Start

**End users:** install and use `wacli` from [README.md](README.md).  
**Developers:** build and contribute via [DEVELOPER_README.md](DEVELOPER_README.md).

## Setup (from source)

```bash
npm install
npm run build
```

First run — scan the QR code with WhatsApp (**Settings → Linked Devices → Link a Device**):

```bash
npm run dev -- me
```

## Common commands

```bash
# Send text
npm run dev -- send -n 14165551234 -m "Hello!"
npm run dev -- send -c "John" -m "Hey John!"

# Send a supported file (optional caption; videos are not allowed)
npm run dev -- send -n 14165551234 -f ./photo.jpg -m "Caption"

# List chats (default 5; use -l for more)
npm run dev -- list
npm run dev -- list -l 10

# Contacts, check number, who am I
npm run dev -- contacts
npm run dev -- check -n 14165551234
npm run dev -- me

# Logout
npm run dev -- logout
```

## Shell script

```bash
chmod +x wacli.sh

./wacli.sh send -n 14165551234 -m "Hello!"
./wacli.sh send -c "Mom" -f ./photo.jpg -m "From today"
./wacli.sh list -l 10
./wacli.sh contacts
./wacli.sh check -n 14165551234
./wacli.sh me
./wacli.sh logout
```

## Phone number format

Include country code, no `+` or spaces:

- USA: `14165551234`
- UK: `447700900123`
- India: `919876543210`

## Troubleshooting

```bash
npm run dev -- logout
npm run dev -- me   # scan QR again
```

- Number not found? Check country code; use `14165551234` not `+1 (416) 555-1234`.
- Help: `./wacli.sh --help` or `wacli --help` after `npm link`.

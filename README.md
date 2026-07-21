# WhatsApp CLI

A command-line tool to send WhatsApp messages from your terminal using your personal WhatsApp account.

## Features

✅ Send messages to any WhatsApp number  
✅ Send messages to saved contacts by name  
✅ List recent chats  
✅ QR code authentication (scan once, stay logged in)  
✅ Local session persistence  
✅ Clean and intuitive CLI interface

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A WhatsApp account

## Installation

### Option 1: Install Globally from npm (Easiest)

```bash
npm install -g @adityakul0314/wacli
```

Then use `wacli` from anywhere:

```bash
wacli --help
```

### Option 2: Install from GitHub

```bash
npm install -g git+https://github.com/Ad1tya-007/whatsapp-cli.git
```

### Option 3: Install from Source

1. **Clone or download this project**

2. **Install dependencies:**

```bash
npm install
```

3. **Build the project:**

```bash
npm run build
```

4. **Link globally (optional):**

```bash
npm link
```

Now you can use `wacli` from anywhere!

## Usage

### Running with ts-node (Development)

You can run the CLI directly with TypeScript using `ts-node`:

```bash
npm run dev send -- -n 14165551234 -m "Hello from CLI"
```

Or use `ts-node` directly:

```bash
npx ts-node src/index.ts send -n 14165551234 -m "Hello from CLI"
```

### Running the built version

After building with `npm run build`:

```bash
node dist/index.js send -n 14165551234 -m "Hello from CLI"
```

### Installing globally (optional)

To use `wacli` command globally:

```bash
npm install -g .
```

Then you can use:

```bash
wacli send -n 14165551234 -m "Hello from CLI"
```

## Commands

### 1. Send Message by Phone Number

Send a message to a phone number (include country code):

```bash
npx ts-node src/index.ts send -n 14165551234 -m "Hello from CLI"
```

**Options:**

- `-n, --number <number>` - Phone number with country code (e.g., 14165551234)
- `-m, --message <message>` - Message text to send

**Examples:**

```bash
# US number
npx ts-node src/index.ts send -n 14165551234 -m "Hello!"

# UK number
npx ts-node src/index.ts send -n 447700900123 -m "Hi there!"

# India number
npx ts-node src/index.ts send -n 919876543210 -m "Namaste!"
```

### 2. Send Message by Contact Name

Send a message to a saved contact by searching their name:

```bash
npx ts-node src/index.ts send -c "John" -m "Hey John!"
```

**Options:**

- `-c, --contact <name>` - Contact name to search for (case-insensitive)
- `-m, --message <message>` - Message text to send

**Example:**

```bash
npx ts-node src/index.ts send -c "Mom" -m "Love you!"
```

### 3. List Recent Chats

View your 5 most recent WhatsApp chats:

```bash
npx ts-node src/index.ts list
```

This will show:

- Contact/group names
- Unread message counts
- Individual (👤) vs Group (👥) indicators

### 4. Logout

Clear your saved session and logout:

```bash
npx ts-node src/index.ts logout
```

You'll need to scan the QR code again on next login.

### 5. Help

View all available commands:

```bash
npx ts-node src/index.ts --help
```

View help for a specific command:

```bash
npx ts-node src/index.ts send --help
```

## First Time Setup

When you run any command for the first time, you'll need to authenticate:

1. Run any command (e.g., `npx ts-node src/index.ts list`)
2. A QR code will appear in your terminal
3. Open WhatsApp on your phone
4. Go to: **Settings > Linked Devices > Link a Device**
5. Scan the QR code displayed in your terminal
6. Wait for "WhatsApp client is ready!" message

Your session will be saved locally in the `.wwebjs_auth` folder, so you won't need to scan the QR code again unless you logout or clear the session.

## Project Structure

```
whatsapp-cli/
├── src/
│   ├── client.ts          # WhatsApp client initialization
│   ├── sendMessage.ts     # Message sending functions
│   └── index.ts           # CLI entry point
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## How It Works

1. **Authentication:** Uses `whatsapp-web.js` to connect to WhatsApp Web
2. **Session Storage:** `LocalAuth` strategy stores session data in `.wwebjs_auth/`
3. **QR Code:** Displayed in terminal using `qrcode-terminal` on first login
4. **CLI Interface:** Built with `commander` for a clean command-line experience
5. **Message Format:** Phone numbers are formatted as `<number>@c.us` for WhatsApp

## Troubleshooting

### QR Code Not Scanning

- Make sure the QR code is fully visible in your terminal
- Try increasing your terminal window size
- Ensure your phone has a stable internet connection

### "Number not registered on WhatsApp"

- Verify the phone number includes the country code
- Remove any spaces, dashes, or special characters
- Example: Use `14165551234` not `+1 (416) 555-1234`

### Session Expired

If you get authentication errors:

```bash
npx ts-node src/index.ts logout
```

Then run your command again to re-authenticate.

### Port Already in Use

If you see "port already in use" errors, another WhatsApp Web instance might be running. Close it and try again.

## Dependencies

- **whatsapp-web.js** - WhatsApp Web API client
- **commander** - CLI framework
- **qrcode-terminal** - QR code display in terminal
- **typescript** - TypeScript compiler
- **ts-node** - Run TypeScript directly

## Notes

- This tool uses WhatsApp Web, so your phone must be connected to the internet
- Messages are sent from your personal WhatsApp account
- Session data is stored locally in `.wwebjs_auth/` - keep this folder secure
- The tool runs in headless mode (no browser window opens)

## License

MIT

## Disclaimer

This project is not affiliated with WhatsApp or Meta. Use responsibly and in accordance with WhatsApp's Terms of Service.

# WhatsApp CLI - Quick Start Guide

## 🚀 Setup (One Time)

```bash
# 1. Install dependencies
npm install

# 2. First run - authenticate with QR code
npm run dev list
```

Scan the QR code with WhatsApp (Settings > Linked Devices > Link a Device)

## 📝 Common Commands

### Send to Phone Number
```bash
npm run dev send -- -n 14165551234 -m "Hello!"
```

### Send to Contact Name
```bash
npm run dev send -- -c "John" -m "Hey John!"
```

### List Chats
```bash
npm run dev list
```

### Logout
```bash
npm run dev logout
```

## 🎯 Using the Shell Script (Easier)

```bash
# Make it executable (one time)
chmod +x wacli.sh

# Then use it
./wacli.sh send -n 14165551234 -m "Hello!"
./wacli.sh send -c "Mom" -m "Love you!"
./wacli.sh list
./wacli.sh logout
```

## 📱 Phone Number Format

Always include country code (no + sign):
- USA: `14165551234`
- UK: `447700900123`
- India: `919876543210`

## 🔧 Project Structure

```
whatsapp-cli/
├── src/
│   ├── client.ts          # WhatsApp client setup
│   ├── sendMessage.ts     # Send & list functions
│   └── index.ts           # CLI commands
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── wacli.sh              # Quick launcher
└── README.md             # Full documentation
```

## ✨ Features

✅ Send by phone number  
✅ Send by contact name  
✅ List recent chats  
✅ QR login (once)  
✅ Session persistence  
✅ Multi-line messages  
✅ Group detection  
✅ Unread count  

## 💡 Pro Tips

1. **Create an alias:**
   ```bash
   echo 'alias wacli="cd /path/to/whatsapp-cli && ./wacli.sh"' >> ~/.zshrc
   source ~/.zshrc
   ```

2. **Send multi-line messages:**
   ```bash
   ./wacli.sh send -n 14165551234 -m "Line 1
   Line 2
   Line 3"
   ```

3. **Use in scripts:**
   ```bash
   #!/bin/bash
   ./wacli.sh send -c "Team" -m "Deploy completed ✅"
   ```

## 🆘 Troubleshooting

**QR code not working?**
```bash
npm run dev logout
npm run dev list  # Scan again
```

**Number not found?**
- Check country code is included
- Remove spaces and special characters
- Format: `14165551234` not `+1 (416) 555-1234`

**Session expired?**
```bash
npm run dev logout
npm run dev list  # Re-authenticate
```

## 📚 More Info

- Full documentation: `README.md`
- Usage examples: `EXAMPLES.md`
- Help: `./wacli.sh --help`

---

**Ready to send your first message?**

```bash
npm install
npm run dev send -- -n YOUR_NUMBER -m "Hello from CLI! 🚀"
```

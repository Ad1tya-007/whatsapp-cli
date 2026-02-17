#!/usr/bin/env node

import { Command } from 'commander';
import { initializeClient, connectClient } from './client';
import { sendMessage, sendMessageByName, listChats } from './sendMessage';

const program = new Command();

// CLI metadata
program
  .name('wacli')
  .description('WhatsApp CLI - Send WhatsApp messages from your terminal')
  .version('1.0.0');

// Command: send
program
  .command('send')
  .description('Send a WhatsApp message')
  .option('-n, --number <number>', 'Phone number with country code (e.g., 14165551234)')
  .option('-c, --contact <name>', 'Contact name to search for')
  .option('-m, --message <message>', 'Message text to send')
  .action(async (options) => {
    try {
      // Validate input
      if (!options.number && !options.contact) {
        console.error('❌ Error: Please provide either --number or --contact');
        process.exit(1);
      }

      if (options.number && options.contact) {
        console.error('❌ Error: Please provide either --number or --contact, not both');
        process.exit(1);
      }

      if (!options.message) {
        console.error('❌ Error: Please provide a message with --message');
        process.exit(1);
      }

      // Initialize and connect client
      const client = initializeClient();
      await connectClient(client);

      // Send message
      if (options.number) {
        await sendMessage(client, options.number, options.message);
      } else if (options.contact) {
        await sendMessageByName(client, options.contact, options.message);
      }

      // Wait a bit before destroying to ensure message is fully sent
      console.log('⏳ Finalizing...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Destroy client
      await client.destroy();
      process.exit(0);
    } catch (error) {
      console.error('❌ Failed to send message');
      process.exit(1);
    }
  });

// Command: list
program
  .command('list')
  .description('List recent WhatsApp chats')
  .action(async () => {
    try {
      // Initialize and connect client
      const client = initializeClient();
      await connectClient(client);

      // List chats
      await listChats(client);

      // Destroy client
      await client.destroy();
      process.exit(0);
    } catch (error) {
      console.error('❌ Failed to list chats');
      process.exit(1);
    }
  });

// Command: logout
program
  .command('logout')
  .description('Logout and clear saved session')
  .action(async () => {
    try {
      const fs = require('fs');
      const path = require('path');
      const authPath = path.join(process.cwd(), '.wwebjs_auth');

      if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log('✅ Session cleared successfully!');
        console.log('   You will need to scan QR code on next login.');
      } else {
        console.log('ℹ️  No saved session found.');
      }

      process.exit(0);
    } catch (error) {
      console.error('❌ Failed to clear session');
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

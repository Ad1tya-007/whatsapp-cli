#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { initializeClient, connectClient, destroyClient, AUTH_PATH } from './client';
import {
  sendMessage,
  sendMessageByName,
  listChats,
  listContacts,
  checkNumber,
  showMe,
} from './sendMessage';

const program = new Command();

program
  .name('wacli')
  .description('WhatsApp CLI - Send WhatsApp messages from your terminal')
  .version('1.0.3');

program
  .command('send')
  .description('Send a WhatsApp message or file')
  .option('-n, --number <number>', 'Phone number with country code (e.g., 14165551234)')
  .option('-c, --contact <name>', 'Contact name to search for')
  .option('-m, --message <message>', 'Message text (or caption when sending a file)')
  .option('-f, --file <path>', 'Path to a file to send (image, document, etc.)')
  .action(async (options) => {
    let client = null;
    try {
      if (!options.number && !options.contact) {
        console.error('❌ Error: Please provide either --number or --contact');
        process.exit(1);
      }

      if (options.number && options.contact) {
        console.error('❌ Error: Please provide either --number or --contact, not both');
        process.exit(1);
      }

      if (!options.message && !options.file) {
        console.error('❌ Error: Please provide --message and/or --file');
        process.exit(1);
      }

      client = initializeClient();
      await connectClient(client);

      if (options.number) {
        await sendMessage(client, options.number, options.message, options.file);
      } else if (options.contact) {
        await sendMessageByName(
          client,
          options.contact,
          options.message,
          options.file,
        );
      }

      console.log('⏳ Finalizing...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      process.exitCode = 0;
    } catch (error) {
      if (error instanceof Error && error.message) {
        console.error('❌ Failed to send message:', error.message);
      } else {
        console.error('❌ Failed to send message');
      }
      process.exitCode = 1;
    } finally {
      await destroyClient(client);
      // Force exit so stray puppeteer callbacks can't crash after success
      process.exit(process.exitCode ?? 1);
    }
  });

program
  .command('list')
  .description('List recent WhatsApp chats')
  .option('-l, --limit <n>', 'Number of chats to show', '5')
  .action(async (options) => {
    let client = null;
    try {
      const limit = Number.parseInt(options.limit, 10);
      if (Number.isNaN(limit) || limit < 1) {
        console.error('❌ Error: --limit must be a positive number');
        process.exit(1);
      }

      client = initializeClient();
      await connectClient(client);
      await listChats(client, limit);
      process.exitCode = 0;
    } catch (error) {
      if (error instanceof Error && error.message) {
        console.error('❌ Failed to list chats:', error.message);
      } else {
        console.error('❌ Failed to list chats');
      }
      process.exitCode = 1;
    } finally {
      await destroyClient(client);
      process.exit(process.exitCode ?? 1);
    }
  });

program
  .command('contacts')
  .description('List saved WhatsApp contacts')
  .action(async () => {
    let client = null;
    try {
      client = initializeClient();
      await connectClient(client);
      await listContacts(client);
      process.exitCode = 0;
    } catch (error) {
      if (error instanceof Error && error.message) {
        console.error('❌ Failed to list contacts:', error.message);
      } else {
        console.error('❌ Failed to list contacts');
      }
      process.exitCode = 1;
    } finally {
      await destroyClient(client);
      process.exit(process.exitCode ?? 1);
    }
  });

program
  .command('check')
  .description('Check if a phone number is registered on WhatsApp')
  .requiredOption('-n, --number <number>', 'Phone number with country code (e.g., 14165551234)')
  .action(async (options) => {
    let client = null;
    try {
      client = initializeClient();
      await connectClient(client);
      await checkNumber(client, options.number);
      process.exitCode = 0;
    } catch (error) {
      if (error instanceof Error && error.message) {
        console.error('❌ Failed to check number:', error.message);
      } else {
        console.error('❌ Failed to check number');
      }
      process.exitCode = 1;
    } finally {
      await destroyClient(client);
      process.exit(process.exitCode ?? 1);
    }
  });

program
  .command('me')
  .description('Show the logged-in WhatsApp account')
  .action(async () => {
    let client = null;
    try {
      client = initializeClient();
      await connectClient(client);
      await showMe(client);
      process.exitCode = 0;
    } catch (error) {
      if (error instanceof Error && error.message) {
        console.error('❌ Failed to get account info:', error.message);
      } else {
        console.error('❌ Failed to get account info');
      }
      process.exitCode = 1;
    } finally {
      await destroyClient(client);
      process.exit(process.exitCode ?? 1);
    }
  });

program
  .command('logout')
  .description('Logout and clear saved session')
  .action(async () => {
    try {
      if (fs.existsSync(AUTH_PATH)) {
        fs.rmSync(AUTH_PATH, { recursive: true, force: true });
        console.log('✅ Session cleared successfully!');
        console.log('   You will need to scan QR code on next login.');
      } else {
        // Also clean legacy project-local session if present
        const legacyPath = path.join(process.cwd(), '.wwebjs_auth');
        if (fs.existsSync(legacyPath)) {
          fs.rmSync(legacyPath, { recursive: true, force: true });
          console.log('✅ Legacy session cleared successfully!');
          console.log('   You will need to scan QR code on next login.');
        } else {
          console.log('ℹ️  No saved session found.');
        }
      }

      process.exit(0);
    } catch (error) {
      console.error('❌ Failed to clear session');
      process.exit(1);
    }
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

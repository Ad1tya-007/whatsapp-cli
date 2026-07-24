import fs from 'fs';
import path from 'path';
import { Client, MessageMedia } from 'whatsapp-web.js';

/**
 * Format phone number to digits only (country code included, no + or spaces)
 */
export function cleanPhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

function serializedId(
  id: { _serialized?: string; $1?: string; user?: string } | null | undefined,
): string | null {
  if (!id) return null;
  return id._serialized || (id as { $1?: string }).$1 || null;
}

/**
 * Resolve a phone number to the WhatsApp chat ID WhatsApp Web expects.
 * Prefer getNumberId over manually appending @c.us — WhatsApp may return
 * a LID-based id that @c.us alone cannot address.
 */
async function resolveChatId(
  client: Client,
  phoneNumber: string,
): Promise<string> {
  const cleanNumber = cleanPhoneNumber(phoneNumber);
  const numberId = await client.getNumberId(cleanNumber);
  const chatId = serializedId(
    numberId as { _serialized?: string; $1?: string },
  );

  if (!chatId) {
    throw new Error(`Number ${phoneNumber} is not registered on WhatsApp`);
  }

  return chatId;
}

async function findContactByName(
  client: Client,
  contactName: string,
): Promise<{ name: string; chatId: string }> {
  const contacts = await client.getContacts();

  const contact = contacts.find(
    (c) =>
      c.name?.toLowerCase().includes(contactName.toLowerCase()) ||
      c.pushname?.toLowerCase().includes(contactName.toLowerCase()),
  );

  if (!contact) {
    throw new Error(`Contact "${contactName}" not found`);
  }

  const chatId = serializedId(
    contact.id as { _serialized?: string; $1?: string },
  );
  if (!chatId) {
    throw new Error(`Contact "${contactName}" has no valid WhatsApp ID`);
  }

  return {
    name: contact.name || contact.pushname || contactName,
    chatId,
  };
}

function loadMedia(filePath: string): MessageMedia {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }
  if (!fs.statSync(resolved).isFile()) {
    throw new Error(`Not a file: ${resolved}`);
  }
  return MessageMedia.fromFilePath(resolved);
}

function logSendResult(result: { id?: { id: string }; timestamp: number }): void {
  if (result && result.id) {
    console.log('✅ Message sent successfully!');
    console.log(`   Message ID: ${result.id.id}`);
    console.log(
      `   Timestamp: ${new Date(result.timestamp * 1000).toLocaleString()}`,
    );
  } else {
    throw new Error('Message sending failed - no confirmation received');
  }
}

/**
 * Send a text and/or media message to a WhatsApp number
 */
export async function sendMessage(
  client: Client,
  phoneNumber: string,
  message?: string,
  filePath?: string,
): Promise<void> {
  try {
    console.log(`\n📤 Preparing to send message to ${phoneNumber}...`);

    const chatId = await resolveChatId(client, phoneNumber);
    console.log(`   Chat ID: ${chatId}`);
    console.log('✅ Number is registered on WhatsApp');
    console.log('📤 Sending message...');

    const result = filePath
      ? await client.sendMessage(chatId, loadMedia(filePath), {
          caption: message || undefined,
        })
      : await client.sendMessage(chatId, message as string);

    logSendResult(result);
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error sending message:', error.message);
    } else {
      console.error('❌ Error sending message:', error);
    }
    throw error;
  }
}

/**
 * Send a text and/or media message to a contact by name
 */
export async function sendMessageByName(
  client: Client,
  contactName: string,
  message?: string,
  filePath?: string,
): Promise<void> {
  try {
    console.log(`\n🔍 Searching for contact: ${contactName}...`);

    const { name, chatId } = await findContactByName(client, contactName);

    console.log(`✅ Found contact: ${name}`);
    console.log(`   Contact ID: ${chatId}`);
    console.log(`📤 Sending message...`);

    const result = filePath
      ? await client.sendMessage(chatId, loadMedia(filePath), {
          caption: message || undefined,
        })
      : await client.sendMessage(chatId, message as string);

    logSendResult(result);
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error sending message:', error.message);
    } else {
      console.error('❌ Error sending message:', error);
    }
    throw error;
  }
}

/**
 * Check whether a phone number is registered on WhatsApp
 */
export async function checkNumber(
  client: Client,
  phoneNumber: string,
): Promise<void> {
  try {
    console.log(`\n🔍 Checking number ${phoneNumber}...`);

    const cleanNumber = cleanPhoneNumber(phoneNumber);
    const numberId = await client.getNumberId(cleanNumber);
    const chatId = serializedId(
      numberId as { _serialized?: string; $1?: string },
    );

    if (!chatId) {
      console.log(`❌ ${phoneNumber} is not registered on WhatsApp`);
      return;
    }

    console.log(`✅ ${phoneNumber} is registered on WhatsApp`);
    console.log(`   Chat ID: ${chatId}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error checking number:', error.message);
    } else {
      console.error('❌ Error checking number:', error);
    }
    throw error;
  }
}

/**
 * Show the logged-in WhatsApp account
 */
export async function showMe(client: Client): Promise<void> {
  try {
    const info = client.info;
    if (!info) {
      throw new Error('Client info is not available yet');
    }

    const wid = info.wid as { user?: string; _serialized?: string; $1?: string };
    const number = wid.user || serializedId(wid) || 'unknown';
    const name = info.pushname || 'Unknown';

    console.log('\n👤 Logged-in account:\n');
    console.log(`   Name:   ${name}`);
    console.log(`   Number: ${number}`);
    if (info.platform) {
      console.log(`   Platform: ${info.platform}`);
    }
    console.log('');
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error reading account info:', error.message);
    } else {
      console.error('❌ Error reading account info:', error);
    }
    throw error;
  }
}

/**
 * List saved contacts (name + number)
 */
export async function listContacts(client: Client): Promise<void> {
  try {
    console.log('\n📇 Fetching contacts...\n');

    const contacts = await client.getContacts();

    const rows = contacts
      .filter((c) => !c.isGroup && (c.name || c.pushname))
      .map((c) => {
        const id = c.id as { user?: string; _serialized?: string; $1?: string };
        const number = id.user || serializedId(id) || '';
        return {
          name: c.name || c.pushname || 'Unknown',
          number,
        };
      })
      .filter((c) => c.number && !c.number.includes('@'))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Deduplicate by number
    const seen = new Set<string>();
    const unique = rows.filter((c) => {
      if (seen.has(c.number)) return false;
      seen.add(c.number);
      return true;
    });

    if (unique.length === 0) {
      console.log('No contacts found.');
      return;
    }

    console.log(`Showing ${unique.length} contacts:\n`);
    unique.forEach((c, index) => {
      console.log(`${index + 1}. ${c.name} — ${c.number}`);
    });
    console.log('');
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error listing contacts:', error.message);
    } else {
      console.error('❌ Error listing contacts:', error);
    }
    throw error;
  }
}

type ChatSummary = {
  name: string;
  isGroup: boolean;
  unreadCount: number;
  timestamp: number;
};

/**
 * List recent chats using a lightweight Store read.
 * Avoids client.getChats()/getChatModel which still crash on some WA Web builds.
 */
export async function listChats(
  client: Client,
  limit = 5,
): Promise<void> {
  try {
    const safeLimit = Math.max(1, Math.floor(limit));
    console.log('\n📋 Fetching chats...\n');

    const page = (
      client as Client & {
        pupPage?: {
          evaluate: <T>(
            fn: (n: number) => T | Promise<T>,
            n: number,
          ) => Promise<T>;
        };
      }
    ).pupPage;
    if (!page) {
      throw new Error('WhatsApp page is not ready');
    }

    const chats = (await page.evaluate((n: number) => {
      // Runs inside WhatsApp Web's Chromium page
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = globalThis as any;
      const collections = w.require('WAWebCollections');
      const models = collections.Chat.getModelsArray() || [];

      return models
        .map((chat: any) => {
          const id = chat.id?._serialized || chat.id?.$1 || '';
          const name =
            chat.name ||
            chat.formattedTitle ||
            chat.contact?.name ||
            chat.contact?.pushname ||
            id ||
            'Unknown';

          return {
            name,
            isGroup: Boolean(chat.isGroup || chat.id?.server === 'g.us'),
            unreadCount: chat.unreadCount || 0,
            timestamp: chat.t || chat.timestamp || 0,
          };
        })
        .sort(
          (a: { timestamp: number }, b: { timestamp: number }) =>
            b.timestamp - a.timestamp,
        )
        .slice(0, n);
    }, safeLimit)) as ChatSummary[];

    if (chats.length === 0) {
      console.log('No chats found.');
      return;
    }

    console.log(`Showing ${chats.length} most recent chats:\n`);

    chats.forEach((chat, index) => {
      const isGroup = chat.isGroup ? '👥' : '👤';
      const unread =
        chat.unreadCount > 0 ? ` (${chat.unreadCount} unread)` : '';
      console.log(`${index + 1}. ${isGroup} ${chat.name}${unread}`);
    });

    console.log('\n');
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error listing chats:', error.message);
    } else {
      console.error('❌ Error listing chats:', error);
    }
    throw error;
  }
}

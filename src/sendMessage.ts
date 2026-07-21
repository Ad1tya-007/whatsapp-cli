import { Client } from 'whatsapp-web.js';

/**
 * Format phone number to digits only (country code included, no + or spaces)
 */
export function cleanPhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '');
}

function serializedId(id: { _serialized?: string; $1?: string } | null | undefined): string | null {
  if (!id) return null;
  return id._serialized || (id as { $1?: string }).$1 || null;
}

/**
 * Resolve a phone number to the WhatsApp chat ID WhatsApp Web expects.
 * Prefer getNumberId over manually appending @c.us — WhatsApp may return
 * a LID-based id that @c.us alone cannot address.
 */
async function resolveChatId(client: Client, phoneNumber: string): Promise<string> {
  const cleanNumber = cleanPhoneNumber(phoneNumber);
  const numberId = await client.getNumberId(cleanNumber);
  const chatId = serializedId(numberId as { _serialized?: string; $1?: string });

  if (!chatId) {
    throw new Error(`Number ${phoneNumber} is not registered on WhatsApp`);
  }

  return chatId;
}

/**
 * Send a message to a WhatsApp number
 */
export async function sendMessage(
  client: Client,
  phoneNumber: string,
  message: string
): Promise<void> {
  try {
    console.log(`\n📤 Preparing to send message to ${phoneNumber}...`);

    const chatId = await resolveChatId(client, phoneNumber);
    console.log(`   Chat ID: ${chatId}`);
    console.log('✅ Number is registered on WhatsApp');
    console.log('📤 Sending message...');

    const result = await client.sendMessage(chatId, message);

    if (result && result.id) {
      console.log('✅ Message sent successfully!');
      console.log(`   Message ID: ${result.id.id}`);
      console.log(`   Timestamp: ${new Date(result.timestamp * 1000).toLocaleString()}`);
    } else {
      throw new Error('Message sending failed - no confirmation received');
    }
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
 * Send a message to a contact by name
 */
export async function sendMessageByName(
  client: Client,
  contactName: string,
  message: string
): Promise<void> {
  try {
    console.log(`\n🔍 Searching for contact: ${contactName}...`);

    const contacts = await client.getContacts();

    const contact = contacts.find(
      (c) =>
        c.name?.toLowerCase().includes(contactName.toLowerCase()) ||
        c.pushname?.toLowerCase().includes(contactName.toLowerCase())
    );

    if (!contact) {
      throw new Error(`Contact "${contactName}" not found`);
    }

    const chatId = serializedId(contact.id as { _serialized?: string; $1?: string });
    if (!chatId) {
      throw new Error(`Contact "${contactName}" has no valid WhatsApp ID`);
    }

    console.log(`✅ Found contact: ${contact.name || contact.pushname}`);
    console.log(`   Contact ID: ${chatId}`);
    console.log(`📤 Sending message...`);

    const result = await client.sendMessage(chatId, message);

    if (result && result.id) {
      console.log('✅ Message sent successfully!');
      console.log(`   Message ID: ${result.id.id}`);
      console.log(`   Timestamp: ${new Date(result.timestamp * 1000).toLocaleString()}`);
    } else {
      throw new Error('Message sending failed - no confirmation received');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error sending message:', error.message);
    } else {
      console.error('❌ Error sending message:', error);
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
 * List the 5 most recent chats using a lightweight Store read.
 * Avoids client.getChats()/getChatModel which still crash on some WA Web builds.
 */
export async function listChats(client: Client): Promise<void> {
  try {
    console.log('\n📋 Fetching chats...\n');

    const page = (client as Client & { pupPage?: { evaluate: <T>(fn: () => T | Promise<T>) => Promise<T> } }).pupPage;
    if (!page) {
      throw new Error('WhatsApp page is not ready');
    }

    const chats = await page.evaluate(() => {
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
        .sort((a: { timestamp: number }, b: { timestamp: number }) => b.timestamp - a.timestamp)
        .slice(0, 5);
    }) as ChatSummary[];

    if (chats.length === 0) {
      console.log('No chats found.');
      return;
    }

    console.log(`Showing ${chats.length} most recent chats:\n`);

    chats.forEach((chat, index) => {
      const isGroup = chat.isGroup ? '👥' : '👤';
      const unread = chat.unreadCount > 0 ? ` (${chat.unreadCount} unread)` : '';
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

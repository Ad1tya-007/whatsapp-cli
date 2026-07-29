import { Client } from 'whatsapp-web.js';

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
export async function listChats(client: Client, limit = 5): Promise<void> {
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

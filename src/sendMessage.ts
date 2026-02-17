import { Client } from 'whatsapp-web.js';

/**
 * Format phone number to WhatsApp chat ID
 * @param phoneNumber - Phone number with country code (e.g., 14165551234)
 * @returns Formatted chat ID (e.g., 14165551234@c.us)
 */
export function formatChatId(phoneNumber: string): string {
  // Remove any non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  return `${cleanNumber}@c.us`;
}

/**
 * Send a message to a WhatsApp number
 * @param client - WhatsApp client instance
 * @param phoneNumber - Phone number with country code
 * @param message - Message text to send
 */
export async function sendMessage(
  client: Client,
  phoneNumber: string,
  message: string
): Promise<void> {
  try {
    const chatId = formatChatId(phoneNumber);
    console.log(`\n📤 Preparing to send message to ${phoneNumber}...`);
    console.log(`   Chat ID: ${chatId}`);

    // Check if the number is registered on WhatsApp
    const isRegistered = await client.isRegisteredUser(chatId);
    
    if (!isRegistered) {
      throw new Error(`Number ${phoneNumber} is not registered on WhatsApp`);
    }

    console.log('✅ Number is registered on WhatsApp');
    console.log('📤 Sending message...');

    // Get or create the chat first
    const chat = await client.getChatById(chatId);
    
    // Send the message through the chat
    const result = await chat.sendMessage(message);
    
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
 * @param client - WhatsApp client instance
 * @param contactName - Contact name to search for
 * @param message - Message text to send
 */
export async function sendMessageByName(
  client: Client,
  contactName: string,
  message: string
): Promise<void> {
  try {
    console.log(`\n🔍 Searching for contact: ${contactName}...`);

    // Get all contacts
    const contacts = await client.getContacts();
    
    // Search for contact by name (case-insensitive)
    const contact = contacts.find((c) =>
      c.name?.toLowerCase().includes(contactName.toLowerCase()) ||
      c.pushname?.toLowerCase().includes(contactName.toLowerCase())
    );

    if (!contact) {
      throw new Error(`Contact "${contactName}" not found`);
    }

    console.log(`✅ Found contact: ${contact.name || contact.pushname}`);
    console.log(`   Contact ID: ${contact.id._serialized}`);
    console.log(`📤 Sending message...`);

    // Get the chat first
    const chat = await client.getChatById(contact.id._serialized);
    
    // Send the message through the chat
    const result = await chat.sendMessage(message);
    
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
 * List all chats
 * @param client - WhatsApp client instance
 */
export async function listChats(client: Client): Promise<void> {
  try {
    console.log('\n📋 Fetching chats...\n');

    const chats = await client.getChats();
    
    if (chats.length === 0) {
      console.log('No chats found.');
      return;
    }

    console.log(`Found ${chats.length} chats:\n`);
    
    // Sort by last message timestamp (most recent first)
    const sortedChats = chats
      .filter((chat) => chat.timestamp)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20); // Show only the 20 most recent chats

    sortedChats.forEach((chat, index) => {
      const name = chat.name || 'Unknown';
      const isGroup = chat.isGroup ? '👥' : '👤';
      const unread = chat.unreadCount > 0 ? ` (${chat.unreadCount} unread)` : '';
      
      console.log(`${index + 1}. ${isGroup} ${name}${unread}`);
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

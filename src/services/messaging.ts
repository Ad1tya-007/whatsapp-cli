import { Client } from 'whatsapp-web.js';
import { cleanPhoneNumber } from '../utils/phone';
import { serializedId } from '../utils/ids';
import { resolveContactByName } from './contacts';
import { sendMediaMessage } from './media';

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

function logSendResult(result: {
  id?: { id: string };
  timestamp: number;
}): void {
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

async function deliver(
  client: Client,
  chatId: string,
  message?: string,
  filePath?: string,
): Promise<void> {
  console.log('📤 Sending message...');

  const result = filePath
    ? await sendMediaMessage(client, chatId, filePath, message)
    : await client.sendMessage(chatId, message as string);

  logSendResult(result);
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

    await deliver(client, chatId, message, filePath);
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

    const resolved = await resolveContactByName(client, contactName);

    console.log(`✅ Found contact: ${resolved.name}`);
    if (resolved.number) {
      console.log(`   Number: ${resolved.number}`);
    }
    console.log(`   Contact ID: ${resolved.chatId}`);

    await deliver(client, resolved.chatId, message, filePath);
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error sending message:', error.message);
    } else {
      console.error('❌ Error sending message:', error);
    }
    throw error;
  }
}

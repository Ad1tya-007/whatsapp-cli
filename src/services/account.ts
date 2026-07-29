import { Client } from 'whatsapp-web.js';
import { cleanPhoneNumber } from '../utils/phone';
import { serializedId } from '../utils/ids';

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

    const wid = info.wid as {
      user?: string;
      _serialized?: string;
      $1?: string;
    };
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

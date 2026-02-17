import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

/**
 * Initialize and return a WhatsApp client instance
 * Uses LocalAuth to persist session data locally
 */
export function initializeClient(): Client {
  console.log('🔄 Initializing WhatsApp client...');

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: '.wwebjs_auth', // Store session data in this folder
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  // Event: QR code received - display in terminal
  client.on('qr', (qr) => {
    console.log('\n📱 QR Code received! Scan with WhatsApp:');
    console.log('   Open WhatsApp > Settings > Linked Devices > Link a Device\n');
    qrcode.generate(qr, { small: true });
  });

  // Event: Authentication successful
  client.on('authenticated', () => {
    console.log('✅ Authentication successful!');
  });

  // Event: Client is ready
  client.on('ready', () => {
    console.log('✅ WhatsApp client is ready!');
  });

  // Event: Authentication failure
  client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failure:', msg);
  });

  // Event: Client disconnected
  client.on('disconnected', (reason) => {
    console.log('⚠️  Client disconnected:', reason);
  });

  // Event: Loading screen updates
  client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Loading: ${percent}% - ${message}`);
  });

  return client;
}

/**
 * Connect the WhatsApp client
 * Returns a promise that resolves when the client is ready
 */
export async function connectClient(client: Client): Promise<void> {
  return new Promise((resolve, reject) => {
    client.once('ready', () => {
      resolve();
    });

    client.once('auth_failure', (msg) => {
      reject(new Error(`Authentication failed: ${msg}`));
    });

    client.initialize().catch(reject);
  });
}

import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import os from 'os';
import path from 'path';

/** Persistent auth directory (works from any cwd) */
export const AUTH_PATH = path.join(os.homedir(), '.wacli');

function migrateLegacySessionIfNeeded(): void {
  const legacyPath = path.join(process.cwd(), '.wwebjs_auth');
  const targetSession = path.join(AUTH_PATH, 'session');
  const legacySession = path.join(legacyPath, 'session');

  if (fs.existsSync(targetSession) || !fs.existsSync(legacySession)) {
    return;
  }

  try {
    fs.mkdirSync(AUTH_PATH, { recursive: true });
    fs.cpSync(legacySession, targetSession, { recursive: true });
    for (const name of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
      const lockPath = path.join(targetSession, name);
      if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
    }
    console.log('ℹ️  Migrated existing session to ~/.wacli');
  } catch {
    // ignore migration failures — user can re-scan QR
  }
}

/**
 * Remove Chrome SingletonLock files left behind when the process
 * exited without calling client.destroy() (common cause of "Failed to list/send").
 */
function clearStaleBrowserLocks(authPath: string): void {
  const sessionDir = path.join(authPath, 'session');
  const lockNames = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];

  for (const name of lockNames) {
    const lockPath = path.join(sessionDir, name);
    if (!fs.existsSync(lockPath)) continue;

    try {
      if (name === 'SingletonLock') {
        const target = fs.readlinkSync(lockPath);
        const pid = Number(String(target).split('-').pop());
        if (pid && !Number.isNaN(pid)) {
          try {
            process.kill(pid, 0); // throws if not running
            continue; // browser still alive — leave the lock alone
          } catch {
            // process is dead — safe to remove
          }
        }
      }
      fs.unlinkSync(lockPath);
    } catch {
      // ignore unlink races
    }
  }
}

/**
 * Initialize and return a WhatsApp client instance
 * Uses LocalAuth to persist session data locally
 */
export function initializeClient(): Client {
  console.log('🔄 Initializing WhatsApp client...');

  fs.mkdirSync(AUTH_PATH, { recursive: true });
  migrateLegacySessionIfNeeded();
  clearStaleBrowserLocks(AUTH_PATH);

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: AUTH_PATH,
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
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
  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    client.once('ready', () => settle(() => resolve()));

    client.once('auth_failure', (msg) =>
      settle(() => reject(new Error(`Authentication failed: ${msg}`)))
    );

    client.initialize().catch((err) => settle(() => reject(err)));
  });
}

/**
 * Safely destroy the client (ignores errors during teardown).
 * Removes page listeners first so framenavigated handlers don't throw
 * TargetCloseError after the browser is closed.
 */
export async function destroyClient(client: Client | null | undefined): Promise<void> {
  if (!client) return;

  const swallowTeardown = (reason: unknown) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    if (
      message.includes('Target closed') ||
      message.includes('Protocol error') ||
      message.includes('Session closed') ||
      message.includes('Execution context was destroyed')
    ) {
      return;
    }
    // Re-emit unexpected rejections so they aren't silently lost
    console.error('Unhandled rejection during teardown:', reason);
  };

  process.on('unhandledRejection', swallowTeardown);

  try {
    client.removeAllListeners();

    const page = (client as Client & { pupPage?: { removeAllListeners: () => void } }).pupPage;
    if (page) {
      try {
        page.removeAllListeners();
      } catch {
        // ignore
      }
    }

    await Promise.race([
      client.destroy().catch(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch {
    // ignore teardown errors
  } finally {
    process.off('unhandledRejection', swallowTeardown);
  }
}

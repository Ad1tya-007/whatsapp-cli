import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import {
  AUTH_PATH,
  clearStaleBrowserLocks,
  migrateLegacySessionIfNeeded,
  readProfileBrowserVersion,
} from './session';
import {
  compareVersions,
  readBrowserVersion,
  resolveBundledChromePath,
  resolveChromePath,
} from './chrome';

export { AUTH_PATH } from './session';
export { resolveChromePath } from './chrome';

/**
 * Chrome refuses a profile last written by a newer build, which otherwise
 * surfaces as an opaque 30s "Waiting failed" timeout during initialize.
 */
function assertProfileIsUsable(executablePath: string | null): void {
  const profileVersion = readProfileBrowserVersion(AUTH_PATH);
  if (!profileVersion) return;

  const browserPath = executablePath || resolveBundledChromePath();
  if (!browserPath) return;

  const browserVersion = readBrowserVersion(browserPath);
  if (!browserVersion) return;

  if (compareVersions(profileVersion, browserVersion) <= 0) return;

  throw new Error(
    `Saved session was created by Chrome ${profileVersion}, but the browser in use is ${browserVersion}. ` +
      'Install/update Google Chrome (or set CHROME_PATH), or run `wacli logout` to reset the session.',
  );
}

/**
 * Initialize and return a WhatsApp client instance.
 * Uses LocalAuth to persist session data locally.
 */
export function initializeClient(): Client {
  console.log('🔄 Initializing WhatsApp client...');

  fs.mkdirSync(AUTH_PATH, { recursive: true });
  migrateLegacySessionIfNeeded();
  clearStaleBrowserLocks(AUTH_PATH);

  const puppeteerOptions: {
    headless: boolean;
    args: string[];
    executablePath?: string;
  } = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  };

  // The session profile is shared by every command, and Chrome profiles are not
  // backward compatible, so the same browser must be used everywhere.
  const chromePath = resolveChromePath();
  if (chromePath) {
    puppeteerOptions.executablePath = chromePath;
  }

  assertProfileIsUsable(chromePath);

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: AUTH_PATH,
    }),
    puppeteer: puppeteerOptions,
  });

  client.on('qr', (qr) => {
    console.log('\n📱 QR Code received! Scan with WhatsApp:');
    console.log('   Open WhatsApp > Settings > Linked Devices > Link a Device\n');
    qrcode.generate(qr, { small: true });
  });

  client.on('authenticated', () => {
    console.log('✅ Authentication successful!');
  });

  client.on('ready', () => {
    console.log('✅ WhatsApp client is ready!');
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failure:', msg);
  });

  client.on('disconnected', (reason) => {
    console.log('⚠️  Client disconnected:', reason);
  });

  client.on('loading_screen', (percent, message) => {
    console.log(`⏳ Loading: ${percent}% - ${message}`);
  });

  return client;
}

/**
 * Connect the WhatsApp client.
 * Returns a promise that resolves when the client is ready.
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
      settle(() => reject(new Error(`Authentication failed: ${msg}`))),
    );

    client.once('disconnected', (reason) =>
      settle(() =>
        reject(
          new Error(
            String(reason) === 'LOGOUT'
              ? 'WhatsApp signed this device out. Run `wacli logout`, then any command to scan the QR code again.'
              : `Disconnected before the client was ready: ${reason}`,
          ),
        ),
      ),
    );

    client.initialize().catch((err) => settle(() => reject(err)));
  });
}

const BROWSER_NOISE_FRAGMENTS = [
  'Target closed',
  'Protocol error',
  'Session closed',
  'Execution context was destroyed',
  'detached Frame',
];

/** Puppeteer rejections that are expected while the page navigates or closes. */
export function isBrowserNoise(reason: unknown): boolean {
  const message = reason instanceof Error ? reason.message : String(reason);
  return BROWSER_NOISE_FRAGMENTS.some((fragment) =>
    message.includes(fragment),
  );
}

/**
 * WhatsApp Web navigates during logout/teardown, so puppeteer can reject after
 * the command already finished. Node would otherwise abort with a stack trace.
 */
export function installBrowserNoiseGuard(): () => void {
  const onUnhandledRejection = (reason: unknown) => {
    if (isBrowserNoise(reason)) return;
    console.error('Unhandled rejection:', reason);
  };

  process.on('unhandledRejection', onUnhandledRejection);
  return () => process.off('unhandledRejection', onUnhandledRejection);
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Chrome holds a singleton lock on the profile until it fully exits, so a
 * relaunch must not race a browser that is still shutting down or wedged.
 */
async function waitForBrowserExit(pid: number, timeoutMs = 5000): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (!isProcessAlive(pid)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (!isProcessAlive(pid)) return;

  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    // already gone
  }

  while (isProcessAlive(pid) && Date.now() < deadline + 2000) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Safely destroy the client (ignores errors during teardown).
 * Removes page listeners first so framenavigated handlers don't throw
 * TargetCloseError after the browser is closed.
 */
export async function destroyClient(
  client: Client | null | undefined,
): Promise<void> {
  if (!client) return;

  const browserPid = (
    client as Client & {
      pupBrowser?: { process?: () => { pid?: number } | null };
    }
  ).pupBrowser?.process?.()?.pid;

  const removeNoiseGuard = installBrowserNoiseGuard();

  try {
    client.removeAllListeners();

    const page = (
      client as Client & { pupPage?: { removeAllListeners: () => void } }
    ).pupPage;
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

    if (browserPid) {
      await waitForBrowserExit(browserPid);
    }
  } catch {
    // ignore teardown errors
  } finally {
    removeNoiseGuard();
  }
}

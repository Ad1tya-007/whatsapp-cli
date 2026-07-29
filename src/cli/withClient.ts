import { Client } from 'whatsapp-web.js';
import {
  connectClient,
  destroyClient,
  initializeClient,
  installBrowserNoiseGuard,
} from '../client';

type WithClientOptions = {
  /** Extra delay before teardown (e.g. after send) */
  finalizeMs?: number;
  failureLabel?: string;
};

/**
 * Shared connect → action → destroy → exit lifecycle for WhatsApp commands.
 */
export async function withClient(
  action: (client: Client) => Promise<void>,
  options: WithClientOptions = {},
): Promise<void> {
  const { finalizeMs = 0, failureLabel = 'command' } = options;
  let client: Client | null = null;
  installBrowserNoiseGuard();

  try {
    client = initializeClient();
    await connectClient(client);
    await action(client);

    if (finalizeMs > 0) {
      console.log('⏳ Finalizing...');
      await new Promise((resolve) => setTimeout(resolve, finalizeMs));
    }

    process.exitCode = 0;
  } catch (error) {
    if (error instanceof Error && error.message) {
      console.error(`❌ Failed to ${failureLabel}:`, error.message);
    } else {
      console.error(`❌ Failed to ${failureLabel}`);
    }
    process.exitCode = 1;
  } finally {
    await destroyClient(client);
    // Force exit so stray puppeteer callbacks can't crash after success
    process.exit(process.exitCode ?? 1);
  }
}

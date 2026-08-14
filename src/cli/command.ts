import type { Client } from 'whatsapp-web.js';

export type CommandOption = {
  flags: string;
  description: string;
  required?: boolean;
  defaultValue?: string;
};

export type CommandDefinition<TOptions = Record<string, unknown>> = {
  name: string;
  description: string;
  aliases?: string[];
  options?: CommandOption[];
  /** Default true. Set false for commands that do not need a WhatsApp session (e.g. logout). */
  needsClient?: boolean;
  finalizeMs?: number;
  failureLabel?: string;
  /** Runs before connecting so cheap checks (flags, media type) fail fast. */
  validate?: (options: TOptions) => void;
  run: (client: Client | null, options: TOptions) => Promise<void>;
};

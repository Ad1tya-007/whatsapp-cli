import { sendMessage, sendMessageByName } from '../../services/messaging';
import { assertMediaFileSupported } from '../../services/media';
import type { CommandDefinition } from '../command';

type SendOptions = {
  number?: string;
  contact?: string;
  message?: string;
  file?: string;
};

const send: CommandDefinition<SendOptions> = {
  name: 'send',
  description: 'Send a WhatsApp message or file',
  finalizeMs: 500,
  failureLabel: 'send message',
  options: [
    {
      flags: '-n, --number <number>',
      description: 'Phone number with country code (e.g., 14165551234)',
    },
    {
      flags: '-c, --contact <name>',
      description: 'Contact name to search for',
    },
    {
      flags: '-m, --message <message>',
      description: 'Message text (or caption when sending a file)',
    },
    {
      flags: '-f, --file <path>',
      description: 'Path to a supported file (videos are not allowed)',
    },
  ],
  validate(options) {
    if (!options.number && !options.contact) {
      throw new Error('Please provide either --number or --contact');
    }
    if (options.number && options.contact) {
      throw new Error('Please provide either --number or --contact, not both');
    }
    if (!options.message && !options.file) {
      throw new Error('Please provide --message and/or --file');
    }
    if (options.file) {
      assertMediaFileSupported(options.file);
    }
  },
  async run(client, options) {
    if (!client) {
      throw new Error('WhatsApp client is not available');
    }
    if (options.number) {
      await sendMessage(client, options.number, options.message, options.file);
    } else if (options.contact) {
      await sendMessageByName(
        client,
        options.contact,
        options.message,
        options.file,
      );
    }
  },
};

export default send;

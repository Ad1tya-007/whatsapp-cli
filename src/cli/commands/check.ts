import { checkNumber } from '../../services/account';
import type { CommandDefinition } from '../command';

type CheckOptions = {
  number: string;
};

const check: CommandDefinition<CheckOptions> = {
  name: 'check',
  description: 'Check if a phone number is registered on WhatsApp',
  failureLabel: 'check number',
  options: [
    {
      flags: '-n, --number <number>',
      description: 'Phone number with country code (e.g., 14165551234)',
      required: true,
    },
  ],
  async run(client, options) {
    if (!client) {
      throw new Error('WhatsApp client is not available');
    }
    await checkNumber(client, options.number);
  },
};

export default check;

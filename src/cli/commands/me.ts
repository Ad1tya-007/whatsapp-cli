import { showMe } from '../../services/account';
import type { CommandDefinition } from '../command';

const me: CommandDefinition = {
  name: 'me',
  aliases: ['login'],
  description: 'Log in (scan QR if needed) and show the WhatsApp account',
  failureLabel: 'get account info',
  async run(client) {
    if (!client) {
      throw new Error('WhatsApp client is not available');
    }
    await showMe(client);
  },
};

export default me;

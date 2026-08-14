import { listContacts } from '../../services/contacts';
import type { CommandDefinition } from '../command';

const contacts: CommandDefinition = {
  name: 'contacts',
  description: 'List saved WhatsApp contacts',
  failureLabel: 'list contacts',
  async run(client) {
    if (!client) {
      throw new Error('WhatsApp client is not available');
    }
    await listContacts(client);
  },
};

export default contacts;

import { listChats } from '../../services/chats';
import type { CommandDefinition } from '../command';

type ListOptions = {
  limit: string;
};

const list: CommandDefinition<ListOptions> = {
  name: 'list',
  description: 'List recent WhatsApp chats',
  failureLabel: 'list chats',
  options: [
    {
      flags: '-l, --limit <n>',
      description: 'Number of chats to show',
      defaultValue: '5',
    },
  ],
  validate(options) {
    const limit = Number.parseInt(options.limit, 10);
    if (Number.isNaN(limit) || limit < 1) {
      throw new Error('--limit must be a positive number');
    }
  },
  async run(client, options) {
    if (!client) {
      throw new Error('WhatsApp client is not available');
    }
    const limit = Number.parseInt(options.limit, 10);
    await listChats(client, limit);
  },
};

export default list;

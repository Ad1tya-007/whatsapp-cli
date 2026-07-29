import { Command } from 'commander';
import { withClient } from '../withClient';
import { listChats } from '../../services/chats';

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List recent WhatsApp chats')
    .option('-l, --limit <n>', 'Number of chats to show', '5')
    .action(async (options) => {
      const limit = Number.parseInt(options.limit, 10);
      if (Number.isNaN(limit) || limit < 1) {
        console.error('❌ Error: --limit must be a positive number');
        process.exit(1);
      }

      await withClient((client) => listChats(client, limit), {
        failureLabel: 'list chats',
      });
    });
}

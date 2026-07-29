import { Command } from 'commander';
import { withClient } from '../withClient';
import { listContacts } from '../../services/contacts';

export function registerContactsCommand(program: Command): void {
  program
    .command('contacts')
    .description('List saved WhatsApp contacts')
    .action(async () => {
      await withClient((client) => listContacts(client), {
        failureLabel: 'list contacts',
      });
    });
}

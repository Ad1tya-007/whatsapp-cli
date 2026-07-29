import { Command } from 'commander';
import { withClient } from '../withClient';
import { showMe } from '../../services/account';

export function registerMeCommand(program: Command): void {
  program
    .command('me')
    .description('Show the logged-in WhatsApp account')
    .action(async () => {
      await withClient((client) => showMe(client), {
        failureLabel: 'get account info',
      });
    });
}

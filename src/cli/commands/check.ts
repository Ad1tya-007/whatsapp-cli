import { Command } from 'commander';
import { withClient } from '../withClient';
import { checkNumber } from '../../services/account';

export function registerCheckCommand(program: Command): void {
  program
    .command('check')
    .description('Check if a phone number is registered on WhatsApp')
    .requiredOption(
      '-n, --number <number>',
      'Phone number with country code (e.g., 14165551234)',
    )
    .action(async (options) => {
      await withClient((client) => checkNumber(client, options.number), {
        failureLabel: 'check number',
      });
    });
}

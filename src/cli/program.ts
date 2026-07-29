import { Command } from 'commander';
import { registerSendCommand } from './commands/send';
import { registerListCommand } from './commands/list';
import { registerContactsCommand } from './commands/contacts';
import { registerCheckCommand } from './commands/check';
import { registerMeCommand } from './commands/me';
import { registerLogoutCommand } from './commands/logout';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('wacli')
    .description('WhatsApp CLI - Send WhatsApp messages from your terminal')
    .version('1.0.4');

  registerSendCommand(program);
  registerListCommand(program);
  registerContactsCommand(program);
  registerCheckCommand(program);
  registerMeCommand(program);
  registerLogoutCommand(program);

  return program;
}

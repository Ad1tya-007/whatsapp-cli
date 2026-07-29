import { Command } from 'commander';
import { withClient } from '../withClient';
import { sendMessage, sendMessageByName } from '../../services/messaging';
import { assertMediaFileSupported } from '../../services/media';

export function registerSendCommand(program: Command): void {
  program
    .command('send')
    .description('Send a WhatsApp message or file')
    .option(
      '-n, --number <number>',
      'Phone number with country code (e.g., 14165551234)',
    )
    .option('-c, --contact <name>', 'Contact name to search for')
    .option(
      '-m, --message <message>',
      'Message text (or caption when sending a file)',
    )
    .option(
      '-f, --file <path>',
      'Path to a supported file (videos are not allowed)',
    )
    .action(async (options) => {
      if (!options.number && !options.contact) {
        console.error('❌ Error: Please provide either --number or --contact');
        process.exit(1);
      }

      if (options.number && options.contact) {
        console.error(
          '❌ Error: Please provide either --number or --contact, not both',
        );
        process.exit(1);
      }

      if (!options.message && !options.file) {
        console.error('❌ Error: Please provide --message and/or --file');
        process.exit(1);
      }

      if (options.file) {
        try {
          assertMediaFileSupported(options.file);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          console.error(`❌ Error: ${message}`);
          process.exit(1);
        }
      }

      await withClient(
        async (client) => {
          if (options.number) {
            await sendMessage(
              client,
              options.number,
              options.message,
              options.file,
            );
          } else if (options.contact) {
            await sendMessageByName(
              client,
              options.contact,
              options.message,
              options.file,
            );
          }
        },
        {
          finalizeMs: 500,
          failureLabel: 'send message',
        },
      );
    });
}

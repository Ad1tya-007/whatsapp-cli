import { Command } from 'commander';
import { createRequire } from 'module';
import type { CommandDefinition } from './command';
import { getAllCommands } from './registry';
import { withClient } from './withClient';

const { version } = createRequire(__filename)('../../package.json') as {
  version: string;
};

function bindCommand(program: Command, definition: CommandDefinition): void {
  const cmd = program
    .command(definition.name)
    .description(definition.description);

  if (definition.aliases?.length) {
    cmd.aliases(definition.aliases);
  }

  for (const option of definition.options ?? []) {
    if (option.required) {
      cmd.requiredOption(option.flags, option.description, option.defaultValue);
    } else if (option.defaultValue !== undefined) {
      cmd.option(option.flags, option.description, option.defaultValue);
    } else {
      cmd.option(option.flags, option.description);
    }
  }

  cmd.action(async (options) => {
    try {
      definition.validate?.(options);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error: ${message}`);
      process.exit(1);
    }

    if (definition.needsClient === false) {
      try {
        await definition.run(null, options);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌ ${message}`);
        process.exit(1);
      }
      return;
    }

    await withClient((client) => definition.run(client, options), {
      finalizeMs: definition.finalizeMs,
      failureLabel: definition.failureLabel ?? definition.name,
    });
  });
}

export function createProgram(): Command {
  const program = new Command();

  program
    .name('wacli')
    .description('WhatsApp CLI - Send WhatsApp messages from your terminal')
    .version(version)
    .addHelpText(
      'after',
      `
Examples:
  $ wacli send -c "Matthew" -m "Hello"
  $ wacli send -n 14165551234 -m "Hello"
  $ wacli me
  $ wacli list

From this repo, put the command after -- :
  $ npm run dev -- send -c "Matthew" -m "Hello"
  $ npm run dev -- me
`,
    );

  for (const definition of getAllCommands()) {
    bindCommand(program, definition);
  }

  return program;
}

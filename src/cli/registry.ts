import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import type { CommandDefinition } from './command';

const requireCommand = createRequire(__filename);
const commands = new Map<string, CommandDefinition>();

function isCommandModule(file: string): boolean {
  if (file.endsWith('.d.ts') || file.endsWith('.map')) {
    return false;
  }
  const ext = path.extname(file);
  return ext === '.js' || ext === '.ts';
}

function loadCommands(): void {
  const dir = path.join(__dirname, 'commands');
  const files = fs.readdirSync(dir).filter(isCommandModule).sort();

  for (const file of files) {
    const mod = requireCommand(path.join(dir, file)) as {
      default?: CommandDefinition;
    } & CommandDefinition;
    const cmd = mod.default ?? mod;

    if (!cmd?.name || typeof cmd.run !== 'function') {
      throw new Error(`Invalid command module: ${file}`);
    }
    if (commands.has(cmd.name)) {
      throw new Error(`Duplicate command: ${cmd.name}`);
    }

    commands.set(cmd.name, cmd);
  }
}

loadCommands();

export function getCommand(name: string): CommandDefinition | undefined {
  return commands.get(name);
}

export function getAllCommands(): CommandDefinition[] {
  return [...commands.values()];
}

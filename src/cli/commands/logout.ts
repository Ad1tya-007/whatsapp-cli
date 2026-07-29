import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { AUTH_PATH } from '../../client';

export function registerLogoutCommand(program: Command): void {
  program
    .command('logout')
    .description('Logout and clear saved session')
    .action(async () => {
      try {
        if (fs.existsSync(AUTH_PATH)) {
          fs.rmSync(AUTH_PATH, { recursive: true, force: true });
          console.log('✅ Session cleared successfully!');
          console.log('   You will need to scan QR code on next login.');
        } else {
          const legacyPath = path.join(process.cwd(), '.wwebjs_auth');
          if (fs.existsSync(legacyPath)) {
            fs.rmSync(legacyPath, { recursive: true, force: true });
            console.log('✅ Legacy session cleared successfully!');
            console.log('   You will need to scan QR code on next login.');
          } else {
            console.log('ℹ️  No saved session found.');
          }
        }

        process.exit(0);
      } catch {
        console.error('❌ Failed to clear session');
        process.exit(1);
      }
    });
}

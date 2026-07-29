import fs from 'fs';
import os from 'os';
import path from 'path';

/** Persistent auth directory (works from any cwd) */
export const AUTH_PATH = path.join(os.homedir(), '.wacli');

export function migrateLegacySessionIfNeeded(): void {
  const legacyPath = path.join(process.cwd(), '.wwebjs_auth');
  const targetSession = path.join(AUTH_PATH, 'session');
  const legacySession = path.join(legacyPath, 'session');

  if (fs.existsSync(targetSession) || !fs.existsSync(legacySession)) {
    return;
  }

  try {
    fs.mkdirSync(AUTH_PATH, { recursive: true });
    fs.cpSync(legacySession, targetSession, { recursive: true });
    for (const name of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
      const lockPath = path.join(targetSession, name);
      if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
    }
    console.log('ℹ️  Migrated existing session to ~/.wacli');
  } catch {
    // ignore migration failures — user can re-scan QR
  }
}

/**
 * Chrome records the version that last opened the profile. A profile can be
 * upgraded by a newer browser, but never opened by an older one.
 */
export function readProfileBrowserVersion(authPath: string): string | null {
  try {
    const versionFile = path.join(authPath, 'session', 'Last Version');
    if (!fs.existsSync(versionFile)) return null;
    const contents = fs.readFileSync(versionFile, 'utf8').trim();
    return /^\d+(\.\d+)*$/.test(contents) ? contents : null;
  } catch {
    return null;
  }
}

/**
 * Remove Chrome SingletonLock files left behind when the process
 * exited without calling client.destroy() (common cause of "Failed to list/send").
 */
export function clearStaleBrowserLocks(authPath: string): void {
  const sessionDir = path.join(authPath, 'session');
  const lockNames = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];

  for (const name of lockNames) {
    const lockPath = path.join(sessionDir, name);
    if (!fs.existsSync(lockPath)) continue;

    try {
      if (name === 'SingletonLock') {
        const target = fs.readlinkSync(lockPath);
        const pid = Number(String(target).split('-').pop());
        if (pid && !Number.isNaN(pid)) {
          try {
            process.kill(pid, 0); // throws if not running
            continue; // browser still alive — leave the lock alone
          } catch {
            // process is dead — safe to remove
          }
        }
      }
      fs.unlinkSync(lockPath);
    } catch {
      // ignore unlink races
    }
  }
}

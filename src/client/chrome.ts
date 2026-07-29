import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const PLATFORM_CHROME_PATHS: Record<string, string[]> = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(
      process.env.LOCALAPPDATA || '',
      'Google\\Chrome\\Application\\chrome.exe',
    ),
  ],
  linux: [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ],
};

/**
 * Resolve a system Chrome/Chromium binary.
 * Honors CHROME_PATH when set.
 */
export function resolveChromePath(): string | null {
  const fromEnv = process.env.CHROME_PATH?.trim();
  if (fromEnv && fs.existsSync(fromEnv)) {
    return fromEnv;
  }

  const candidates = PLATFORM_CHROME_PATHS[os.platform()] || [];
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/** Path to the Chromium build bundled with puppeteer, when resolvable. */
export function resolveBundledChromePath(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const puppeteer = require('puppeteer') as { executablePath?: () => string };
    return puppeteer.executablePath?.() || null;
  } catch {
    return null;
  }
}

/** Read `<binary> --version` and return the dotted version, e.g. 150.0.7871.187 */
export function readBrowserVersion(executablePath: string): string | null {
  try {
    const result = spawnSync(executablePath, ['--version'], {
      encoding: 'utf8',
      timeout: 5000,
    });
    const match = /(\d+(?:\.\d+)+)/.exec(result.stdout || '');
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/** Returns > 0 when `a` is newer than `b`, < 0 when older, 0 when equal. */
export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);

  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const diff = (left[i] || 0) - (right[i] || 0);
    if (diff !== 0) return diff;
  }

  return 0;
}

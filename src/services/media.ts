import fs from 'fs';
import path from 'path';
import { Client, MessageMedia } from 'whatsapp-web.js';

const VIDEO_EXTENSIONS = new Set([
  '.mp4',
  '.mov',
  '.webm',
  '.mkv',
  '.avi',
  '.3gp',
  '.m4v',
  '.mpeg',
  '.mpg',
  '.wmv',
  '.flv',
  '.ogv',
  '.ts',
  '.mts',
  '.m2ts',
]);

/** Validate a file before starting the WhatsApp client. */
export function assertMediaFileSupported(filePath: string): string {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found: ${resolved}`);
  }
  if (!fs.statSync(resolved).isFile()) {
    throw new Error(`Not a file: ${resolved}`);
  }

  if (VIDEO_EXTENSIONS.has(path.extname(resolved).toLowerCase())) {
    throw new Error(
      'Video files are not supported and cannot be sent, including as documents.',
    );
  }

  return resolved;
}

export function loadMedia(filePath: string): MessageMedia {
  const media = MessageMedia.fromFilePath(assertMediaFileSupported(filePath));
  if (media.mimetype?.startsWith('video/')) {
    throw new Error(
      'Video files are not supported and cannot be sent, including as documents.',
    );
  }
  return media;
}

/** Send a supported image, audio, or document with an optional caption. */
export async function sendMediaMessage(
  client: Client,
  chatId: string,
  filePath: string,
  caption?: string,
): Promise<{ id?: { id: string }; timestamp: number }> {
  const media = loadMedia(filePath);
  return client.sendMessage(chatId, media, {
    caption: caption || undefined,
  });
}

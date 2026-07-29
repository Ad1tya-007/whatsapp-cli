import { Client, Contact } from 'whatsapp-web.js';
import { serializedId } from '../utils/ids';

export type ResolvedContact = {
  name: string;
  number: string;
  chatId: string;
};

function contactNumber(contact: Contact): string {
  const id = contact.id as { user?: string; _serialized?: string; $1?: string };
  return id.user || serializedId(id) || contact.number || '';
}

function contactChatId(contact: Contact): string | null {
  return serializedId(contact.id as { _serialized?: string; $1?: string });
}

function displayName(contact: Contact, fallback: string): string {
  return contact.name || contact.pushname || fallback;
}

function matchesQuery(value: string | undefined, query: string): boolean {
  return Boolean(value?.toLowerCase().includes(query));
}

function toResolved(
  contact: Contact,
  fallbackName: string,
): ResolvedContact | null {
  const chatId = contactChatId(contact);
  if (!chatId) return null;

  const number = contactNumber(contact);
  return {
    name: displayName(contact, fallbackName),
    number,
    chatId,
  };
}

/**
 * Prefer saved address-book contacts (`isMyContact`) whose saved name matches.
 * Exact name match wins over substring.
 */
export function findSavedContactMatch(
  contacts: Contact[],
  contactName: string,
): ResolvedContact | null {
  const query = contactName.toLowerCase();

  const saved = contacts.filter(
    (c) =>
      !c.isGroup &&
      c.isMyContact &&
      matchesQuery(c.name, query),
  );

  if (saved.length === 0) return null;

  const exact = saved.find((c) => c.name?.toLowerCase() === query);
  const chosen = exact || saved[0];
  return toResolved(chosen, contactName);
}

/**
 * Collect up to `limit` name/pushname matches for interactive selection.
 */
export function findContactCandidates(
  contacts: Contact[],
  contactName: string,
  limit = 5,
): ResolvedContact[] {
  const query = contactName.toLowerCase();
  const seen = new Set<string>();
  const results: ResolvedContact[] = [];

  for (const contact of contacts) {
    if (contact.isGroup) continue;
    if (
      !matchesQuery(contact.name, query) &&
      !matchesQuery(contact.pushname, query)
    ) {
      continue;
    }

    const resolved = toResolved(contact, contactName);
    if (!resolved) continue;

    const dedupeKey = resolved.chatId || resolved.number;
    if (!dedupeKey || seen.has(dedupeKey)) continue;
    if (resolved.number && resolved.number.includes('@')) continue;

    seen.add(dedupeKey);
    results.push(resolved);
    if (results.length >= limit) break;
  }

  return results;
}

async function pickContactInteractively(
  candidates: ResolvedContact[],
  contactName: string,
): Promise<ResolvedContact> {
  console.log(
    `\n⚠️  No saved contact matched "${contactName}". Choose from matches:`,
  );

  // @inquirer/select is ESM-only; dynamic import keeps our CJS build working
  const { default: select } = await import('@inquirer/select');

  const choice = await select({
    message: 'Select a contact',
    choices: candidates.map((c) => ({
      name: `${c.name} — ${c.number || c.chatId}`,
      value: c.chatId,
      description: c.number || undefined,
    })),
  });

  const selected = candidates.find((c) => c.chatId === choice);
  if (!selected) {
    throw new Error('Contact selection cancelled or invalid');
  }
  return selected;
}

/**
 * Resolve `-c` to a chat: saved contacts first, else interactive picker.
 */
export async function resolveContactByName(
  client: Client,
  contactName: string,
): Promise<ResolvedContact> {
  const contacts = await client.getContacts();

  const saved = findSavedContactMatch(contacts, contactName);
  if (saved) {
    return saved;
  }

  const candidates = findContactCandidates(contacts, contactName, 5);
  if (candidates.length === 0) {
    throw new Error(`Contact "${contactName}" not found`);
  }

  return pickContactInteractively(candidates, contactName);
}

/**
 * List saved contacts (name + number)
 */
export async function listContacts(client: Client): Promise<void> {
  try {
    console.log('\n📇 Fetching contacts...\n');

    const contacts = await client.getContacts();

    const rows = contacts
      .filter((c) => !c.isGroup && (c.name || c.pushname))
      .map((c) => {
        const number = contactNumber(c);
        return {
          name: c.name || c.pushname || 'Unknown',
          number,
        };
      })
      .filter((c) => c.number && !c.number.includes('@'))
      .sort((a, b) => a.name.localeCompare(b.name));

    const seen = new Set<string>();
    const unique = rows.filter((c) => {
      if (seen.has(c.number)) return false;
      seen.add(c.number);
      return true;
    });

    if (unique.length === 0) {
      console.log('No contacts found.');
      return;
    }

    console.log(`Showing ${unique.length} contacts:\n`);
    unique.forEach((c, index) => {
      console.log(`${index + 1}. ${c.name} — ${c.number}`);
    });
    console.log('');
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error listing contacts:', error.message);
    } else {
      console.error('❌ Error listing contacts:', error);
    }
    throw error;
  }
}

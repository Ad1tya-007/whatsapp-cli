import { Client } from 'whatsapp-web.js';

export type ResolvedContact = {
  name: string;
  number: string;
  chatId: string;
};

type StorePerson = {
  name: string;
  pushname: string;
  shortName: string;
  verifiedName: string;
  number: string;
  chatId: string;
  isMyContact: boolean;
  isGroup: boolean;
  isMe: boolean;
};

function getPupPage(client: Client): {
  evaluate: <T>(fn: () => T | Promise<T>) => Promise<T>;
} {
  const page = (
    client as Client & {
      pupPage?: {
        evaluate: <T>(fn: () => T | Promise<T>) => Promise<T>;
      };
    }
  ).pupPage;
  if (!page) {
    throw new Error('WhatsApp page is not ready');
  }
  return page;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Read people from WhatsApp Web's Store (contacts + 1:1 chats).
 * Avoids client.getContacts()/getContactModel, which drop IDs/names on
 * current WhatsApp Web the same way getChats() does.
 */
async function readStorePeople(client: Client): Promise<StorePerson[]> {
  const page = getPupPage(client);

  return page.evaluate(() => {
    // Runs inside WhatsApp Web's Chromium page
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = globalThis as any;
    const collections = w.require('WAWebCollections');

    let getName: ((c: any) => string) | undefined;
    let getPushname: ((c: any) => string) | undefined;
    let getShortName: ((c: any) => string) | undefined;
    let getVerifiedName: ((c: any) => string) | undefined;
    let getIsMyContact: ((c: any) => boolean) | undefined;
    let getIsGroup: ((c: any) => boolean) | undefined;
    let getIsMe: ((c: any) => boolean) | undefined;

    try {
      const getters = w.require('WAWebContactGetters');
      getName = getters.getName;
      getPushname = getters.getPushname;
      getShortName = getters.getShortName;
      getVerifiedName = getters.getVerifiedName;
      getIsGroup = getters.getIsGroup;
      getIsMe = getters.getIsMe;
    } catch {
      // getters module can move between WhatsApp Web builds
    }

    try {
      const frontend = w.require('WAWebFrontendContactGetters');
      getIsMyContact = frontend.getIsMyContact;
    } catch {
      // optional
    }

    const asText = (value: unknown): string =>
      typeof value === 'string' ? value : '';

    const call = (
      fn: ((c: any) => unknown) | undefined,
      model: any,
    ): unknown => {
      if (!fn) return undefined;
      try {
        return fn(model);
      } catch {
        return undefined;
      }
    };

    const idParts = (model: any) => {
      const id = model?.id;
      const user = asText(id?.user);
      const server = asText(id?.server);
      const chatId =
        asText(id?._serialized) ||
        asText(id?.$1) ||
        (user && server ? `${user}@${server}` : '');
      return { chatId, user, server };
    };

    const seen = new Set<string>();
    const people: StorePerson[] = [];

    const pushPerson = (person: StorePerson) => {
      if (!person.chatId || person.isGroup || person.isMe) return;
      if (seen.has(person.chatId)) return;
      seen.add(person.chatId);
      people.push(person);
    };

    const fromContact = (contact: any) => {
      const { chatId, user } = idParts(contact);
      const name = asText(
        call(getName, contact) || contact.name || contact.formattedName,
      );
      const pushname = asText(call(getPushname, contact) || contact.pushname);
      const shortName = asText(call(getShortName, contact) || contact.shortName);
      const verifiedName = asText(
        call(getVerifiedName, contact) || contact.verifiedName,
      );

      pushPerson({
        name,
        pushname,
        shortName,
        verifiedName,
        number: user || chatId,
        chatId,
        isMyContact: Boolean(
          call(getIsMyContact, contact) ||
            contact.isMyContact ||
            contact.isAddressBookContact,
        ),
        isGroup: Boolean(
          call(getIsGroup, contact) ||
            contact.isGroup ||
            contact.id?.server === 'g.us',
        ),
        isMe: Boolean(call(getIsMe, contact) || contact.isMe),
      });
    };

    const contacts = collections.Contact.getModelsArray() || [];
    for (const contact of contacts) {
      fromContact(contact);
    }

    const chats = collections.Chat.getModelsArray() || [];
    for (const chat of chats) {
      const isGroup = Boolean(chat.isGroup || chat.id?.server === 'g.us');
      if (isGroup) continue;
      if (chat.contact) {
        fromContact(chat.contact);
      }

      const { chatId, user } = idParts(chat);
      const name = asText(
        chat.name ||
          chat.formattedTitle ||
          chat.contact?.name ||
          chat.contact?.pushname,
      );
      pushPerson({
        name,
        pushname: asText(chat.contact?.pushname),
        shortName: asText(chat.contact?.shortName),
        verifiedName: asText(chat.contact?.verifiedName),
        number: user || chatId,
        chatId,
        isMyContact: Boolean(
          chat.contact?.isMyContact || chat.contact?.isAddressBookContact,
        ),
        isGroup: false,
        isMe: Boolean(chat.contact?.isMe),
      });
    }

    return people;
  }) as Promise<StorePerson[]>;
}

function displayName(person: StorePerson): string {
  return (
    person.name ||
    person.shortName ||
    person.pushname ||
    person.verifiedName ||
    person.number ||
    person.chatId
  );
}

function toResolved(person: StorePerson): ResolvedContact | null {
  if (!person.chatId) return null;
  const number = person.number.includes('@') ? '' : person.number;
  return {
    name: displayName(person),
    number,
    chatId: person.chatId,
  };
}

function matchesQuery(value: string | undefined, query: string): boolean {
  if (!value) return false;
  const haystack = value.toLowerCase();
  if (haystack.includes(query)) return true;
  if (query.length < 2) return false;
  return haystack.split(/\s+/).some((word) => word.startsWith(query));
}

function personMatches(person: StorePerson, query: string): boolean {
  return (
    matchesQuery(person.name, query) ||
    matchesQuery(person.shortName, query) ||
    matchesQuery(person.pushname, query) ||
    matchesQuery(person.verifiedName, query)
  );
}

/**
 * Prefer saved address-book contacts whose saved name matches.
 * Exact name match wins over substring / prefix.
 */
export function findSavedContactMatch(
  people: StorePerson[],
  contactName: string,
): ResolvedContact | null {
  const query = contactName.toLowerCase();

  const saved = people.filter(
    (p) =>
      p.isMyContact &&
      (matchesQuery(p.name, query) || matchesQuery(p.shortName, query)),
  );

  if (saved.length === 0) return null;

  const exact = saved.find(
    (p) =>
      p.name.toLowerCase() === query || p.shortName.toLowerCase() === query,
  );
  return toResolved(exact || saved[0]);
}

/**
 * Collect up to `limit` name/pushname matches for interactive selection.
 */
export function findContactCandidates(
  people: StorePerson[],
  contactName: string,
  limit = 5,
): ResolvedContact[] {
  const query = contactName.toLowerCase();
  const results: ResolvedContact[] = [];

  for (const person of people) {
    if (!personMatches(person, query)) continue;
    const resolved = toResolved(person);
    if (!resolved) continue;
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

async function resolveFromPeople(
  people: StorePerson[],
  contactName: string,
): Promise<ResolvedContact | null> {
  const saved = findSavedContactMatch(people, contactName);
  if (saved) return saved;

  const candidates = findContactCandidates(people, contactName, 5);
  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1) {
    return pickContactInteractively(candidates, contactName);
  }
  return null;
}

/**
 * Resolve `-c` to a chat: saved contacts first, else interactive picker.
 * Retries briefly after login because the contact Store fills in after `ready`.
 */
export async function resolveContactByName(
  client: Client,
  contactName: string,
): Promise<ResolvedContact> {
  let people: StorePerson[] = [];
  let resolved: ResolvedContact | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    people = await readStorePeople(client);
    resolved = await resolveFromPeople(people, contactName);
    if (resolved) return resolved;
    if (attempt < 4) await delay(600);
  }

  const named = people.filter((p) => p.name || p.pushname || p.shortName).length;
  throw new Error(
    `Contact "${contactName}" not found (searched ${named} synced contacts). ` +
      'Try `wacli contacts` to see names WhatsApp Web has synced, or send with -n and the country-code number.',
  );
}

/**
 * List saved contacts (name + number)
 */
export async function listContacts(client: Client): Promise<void> {
  try {
    console.log('\n📇 Fetching contacts...\n');

    const people = await readStorePeople(client);

    const rows = people
      .filter((p) => p.name || p.pushname || p.shortName)
      .map((p) => ({
        name: displayName(p),
        number: p.number.includes('@') ? '' : p.number,
        chatId: p.chatId,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const seen = new Set<string>();
    const unique = rows.filter((c) => {
      const key = c.number || c.chatId;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (unique.length === 0) {
      console.log('No contacts found.');
      return;
    }

    console.log(`Showing ${unique.length} contacts:\n`);
    unique.forEach((c, index) => {
      console.log(`${index + 1}. ${c.name} — ${c.number || c.chatId}`);
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

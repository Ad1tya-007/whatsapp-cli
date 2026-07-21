import { describe, expect, it } from 'vitest';
import { cleanPhoneNumber, serializedId } from '../src/sendMessage';

describe('cleanPhoneNumber', () => {
  it('strips spaces, dashes, and plus signs', () => {
    expect(cleanPhoneNumber('+1 (416) 555-1234')).toBe('14165551234');
  });

  it('leaves digits unchanged', () => {
    expect(cleanPhoneNumber('14165551234')).toBe('14165551234');
  });

  it('returns empty string when there are no digits', () => {
    expect(cleanPhoneNumber('+++ ---')).toBe('');
  });
});

describe('serializedId', () => {
  it('prefers _serialized when present', () => {
    expect(
      serializedId({ _serialized: '14165551234@c.us', $1: 'fallback' }),
    ).toBe('14165551234@c.us');
  });

  it('falls back to $1 when _serialized is missing', () => {
    expect(serializedId({ $1: '1234567890@lid' })).toBe('1234567890@lid');
  });

  it('returns null for nullish or empty ids', () => {
    expect(serializedId(null)).toBeNull();
    expect(serializedId(undefined)).toBeNull();
    expect(serializedId({})).toBeNull();
  });
});

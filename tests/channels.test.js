import { describe, it, expect } from 'vitest';
import {
  classifyChannel, sourceLabel, flagEmoji, regionLabel,
  isPlausibleHost, isSpamHost, CHANNELS,
} from '../src/lib/channels.js';

describe('classifyChannel precedence', () => {
  it('utm_medium wins over everything (dark social rescue)', () => {
    // Empty referrer but tagged as social.
    expect(classifyChannel('', 'social', '')).toBe('social');
    expect(classifyChannel('google.com', 'email', '')).toBe('email');
  });

  it('maps paid mediums to referral, never search', () => {
    expect(classifyChannel('', 'cpc', '')).toBe('referral');
    expect(classifyChannel('', 'ppc', '')).toBe('referral');
    expect(classifyChannel('', 'affiliate', '')).toBe('referral');
  });

  it('maps organic medium to search', () => {
    expect(classifyChannel('', 'organic', '')).toBe('search');
  });

  it('falls back to utm_source when medium is absent', () => {
    expect(classifyChannel('', '', 'substack')).toBe('email');
    expect(classifyChannel('', '', 't.co')).toBe('social');
    expect(classifyChannel('', '', 'google.com')).toBe('search');
  });

  it('classifies referrer hosts', () => {
    expect(classifyChannel('google.com', '', '')).toBe('search');
    expect(classifyChannel('t.co', '', '')).toBe('social');
    expect(classifyChannel('example.com', '', '')).toBe('referral');
  });

  it('checks email hosts before search so webmail is not swallowed', () => {
    // mail.google.com contains "google." but must classify as email.
    expect(classifyChannel('mail.google.com', '', '')).toBe('email');
    expect(classifyChannel('mail.yahoo.com', '', '')).toBe('email');
  });

  it('spam hosts never paint a real channel', () => {
    expect(classifyChannel('semalt.com', '', '')).toBe('other');
    expect(classifyChannel('darodar.com', 'social', '')).toBe('other');
  });

  it('returns direct when nothing is known', () => {
    expect(classifyChannel('', '', '')).toBe('direct');
  });

  it('only ever returns known channels', () => {
    const out = classifyChannel('example.com', 'weird-medium', 'weird-source');
    expect(CHANNELS).toContain(out);
  });
});

describe('isPlausibleHost', () => {
  it('accepts normal hostnames', () => {
    expect(isPlausibleHost('example.com')).toBe(true);
    expect(isPlausibleHost('sub.domain.co.uk')).toBe(true);
  });

  it('rejects bare IPs, empty, and no-TLD strings', () => {
    expect(isPlausibleHost('1.2.3.4')).toBe(false);
    expect(isPlausibleHost('')).toBe(false);
    expect(isPlausibleHost('localhost')).toBe(false);
    expect(isPlausibleHost('has space.com')).toBe(false);
  });
});

describe('isSpamHost', () => {
  it('flags known spam substrings, case-insensitively', () => {
    expect(isSpamHost('semalt.com')).toBe(true);
    expect(isSpamHost('WWW.SEMALT.COM')).toBe(true);
    expect(isSpamHost('free-share-buttons.example')).toBe(true);
  });

  it('does not flag clean hosts', () => {
    expect(isSpamHost('example.com')).toBe(false);
    expect(isSpamHost('')).toBe(false);
  });
});

describe('sourceLabel', () => {
  it('prefers utm_source, then host, then (direct)', () => {
    expect(sourceLabel('example.com', 'Newsletter')).toBe('newsletter');
    expect(sourceLabel('example.com', '')).toBe('example.com');
    expect(sourceLabel('', '')).toBe('(direct)');
  });

  it('bounds the source length', () => {
    expect(sourceLabel('', 'x'.repeat(200)).length).toBe(120);
  });
});

describe('flagEmoji', () => {
  it('converts a valid alpha-2 code to regional indicators', () => {
    expect(flagEmoji('US')).toBe('\u{1F1FA}\u{1F1F8}');
  });

  it('returns a globe for empty or malformed codes', () => {
    const globe = '\u{1F310}';
    expect(flagEmoji('')).toBe(globe);
    expect(flagEmoji('USA')).toBe(globe);
    expect(flagEmoji('u1')).toBe(globe);
  });
});

describe('regionLabel', () => {
  it('prefers the stored subdivision name', () => {
    expect(regionLabel('US', 'CA', 'California')).toBe('California');
  });

  it('falls back to the US-state map by code', () => {
    expect(regionLabel('US', 'TX', '')).toBe('Texas');
  });

  it('returns the bare code when nothing resolves', () => {
    expect(regionLabel('FR', 'XYZ', '')).toBe('XYZ');
    expect(regionLabel('US', '', '')).toBe('');
  });
});

import { describe, expect, it } from 'vitest';
import { createTrackingLink } from '../lib/trackingLink';

describe('createTrackingLink', () => {
  it('returns empty string when origin is missing', () => {
    expect(createTrackingLink('', 'abc')).toBe('');
  });

  it('returns empty string when token is missing', () => {
    expect(createTrackingLink('https://example.com', '')).toBe('');
  });

  it('builds a stable tracking URL', () => {
    expect(createTrackingLink('https://example.com', 'token-1')).toBe(
      'https://example.com/token-1?token=token-1'
    );
  });

  it('supports localhost origin with port', () => {
    expect(createTrackingLink('http://localhost:9999', 'x')).toBe(
      'http://localhost:9999/x?token=x'
    );
  });
});

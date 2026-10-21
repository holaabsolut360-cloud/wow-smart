import { describe, it, expect } from 'vitest';
import { shouldSendLogin, fmtLima } from './authNotify';
describe('authNotify', () => {
  it('throttle 30 min', () => {
    expect(shouldSendLogin(undefined, 0)).toBe(true);
    expect(shouldSendLogin(0, 29 * 60e3)).toBe(false);
    expect(shouldSendLogin(0, 30 * 60e3)).toBe(true);
  });
  it('hora Lima', () => { expect(fmtLima(new Date('2026-10-21T01:00:00Z'))).toMatch(/20:00|8:00/); });
});

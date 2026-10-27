import { describe, it, expect } from 'vitest';
import { shouldSendLogin, fmtLima, createDedupeStore } from './authNotify';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
describe('authNotify', () => {
  it('throttle 30 min', () => {
    expect(shouldSendLogin(undefined, 0)).toBe(true);
    expect(shouldSendLogin(0, 29 * 60e3)).toBe(false);
    expect(shouldSendLogin(0, 30 * 60e3)).toBe(true);
  });
  it('hora Lima', () => { expect(fmtLima(new Date('2026-10-21T01:00:00Z'))).toMatch(/20:00|8:00/); });
  it('dedupe persistente entre procesos (registro 1 vez por correo, ingreso 1 cada 30 min)', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'an-'));
    const a = createDedupeStore(dir), b = createDedupeStore(dir); // simula 2 workers
    expect(a.claimRegistration('Ana@X.com')).toBe(true);
    expect(b.claimRegistration('ana@x.com')).toBe(false);
    expect(a.claimRegistration('ana@x.com')).toBe(false);
    const t0 = 1_800_000 * 1000 + 10;
    expect(a.claimLogin('u1', t0)).toBe(true);
    expect(b.claimLogin('u1', t0 + 30e3)).toBe(false);
    fs.utimesSync(path.join(dir, 'login-u1-1000'), new Date(t0), new Date(t0));
    expect(b.claimLogin('u1', t0 + 29 * 60e3)).toBe(false);
    expect(b.claimLogin('u1', t0 + 31 * 60e3)).toBe(true);
  });
});

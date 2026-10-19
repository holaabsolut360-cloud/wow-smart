import { describe, it, expect } from 'vitest';
import { haversineM, nearbyOffers, offerLive, validLatLng, walletQuotaLeft } from './geoCore';
const store = { id: 's1', lat: -12.1211, lng: -77.0297, radius_m: 300 }; // Miraflores
describe('ofertas cerca de tienda', () => {
  it('distancia', () => { const d = haversineM(store, { lat: -12.1231, lng: -77.0297 }); expect(d).toBeGreaterThan(200); expect(d).toBeLessThan(240); });
  it('valida coordenadas', () => { expect(validLatLng(-12, -77)).toBe(true); expect(validLatLng(0, 0)).toBe(false); expect(validLatLng(91, 0)).toBe(false); });
  it('vigencia', () => {
    const now = new Date('2026-10-19T17:00:00Z');
    expect(offerLive({ starts_at: '2026-10-01', ends_at: '2026-10-19' }, now)).toBe(true);
    expect(offerLive({ ends_at: '2026-10-18' }, now)).toBe(false);
    expect(offerLive({ active: false }, now)).toBe(false);
  });
  it('dentro y fuera del radio', () => {
    const offers = [{ id: 'o1', title: '2x1', active: true }];
    expect(nearbyOffers({ lat: -12.1231, lng: -77.0297 }, [store], offers).offers).toHaveLength(1);
    expect(nearbyOffers({ lat: -12.20, lng: -77.0297 }, [store], offers).offers).toHaveLength(0);
  });
  it('cuota Wallet 3/24h', () => {
    const now = Date.parse('2026-10-19T12:00:00Z');
    expect(walletQuotaLeft(['2026-10-19T01:00:00Z', '2026-10-18T13:00:00Z', '2026-10-17T00:00:00Z'], now)).toBe(1);
  });
});

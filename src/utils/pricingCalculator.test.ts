import { describe, expect, it } from 'vitest';
import { calculatePricing, resolveCatalogTaxRate, taxLabel } from './pricingCalculator';

describe('pricingCalculator', () => {
  it('calculates a price using margin and tax', () => {
    const pricing = calculatePricing({ purchaseCost: 100, marginPercent: 30, taxRate: 18 });
    expect(pricing.profitAmount).toBe(30);
    expect(pricing.netSalePrice).toBe(130);
    expect(Number(pricing.finalPrice.toFixed(2))).toBe(153.4);
  });

  it('resolves the applicable catalog tax rate', () => {
    const defaultPeruTax = resolveCatalogTaxRate({ companyCurrency: 'S/' });
    expect(defaultPeruTax).toBe(18);

    const customTax = resolveCatalogTaxRate({ productTaxRate: 10, companyTaxRate: 18, companyCurrency: 'S/' });
    expect(customTax).toBe(10);
  });

  it('returns an appropriate tax label', () => {
    const peruLabel = taxLabel({ taxRate: 18, companyCountryCode: 'PE', companyCurrency: 'S/' });
    expect(peruLabel).toBe('+ IGV 18%');

    const genericLabel = taxLabel({ taxRate: 20, companyCountryCode: 'US', companyCurrency: '$' });
    expect(genericLabel).toBe('+ Impuesto 20%');
  });
});

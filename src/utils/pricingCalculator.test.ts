import assert from 'node:assert/strict';
import { calculatePricing, resolveCatalogTaxRate, taxLabel } from './pricingCalculator';

function run() {
  const pricing = calculatePricing({ purchaseCost: 100, marginPercent: 30, taxRate: 18 });
  assert.equal(pricing.profitAmount, 30);
  assert.equal(pricing.netSalePrice, 130);
  assert.equal(Number(pricing.finalPrice.toFixed(2)), 153.4);

  const defaultPeruTax = resolveCatalogTaxRate({ companyCurrency: 'S/' });
  assert.equal(defaultPeruTax, 18);

  const customTax = resolveCatalogTaxRate({ productTaxRate: 10, companyTaxRate: 18, companyCurrency: 'S/' });
  assert.equal(customTax, 10);

  const peruLabel = taxLabel({ taxRate: 18, companyCountryCode: 'PE', companyCurrency: 'S/' });
  assert.equal(peruLabel, '+ IGV 18%');

  const genericLabel = taxLabel({ taxRate: 20, companyCountryCode: 'US', companyCurrency: '$' });
  assert.equal(genericLabel, '+ Impuesto 20%');
}

run();

export interface PricingInput {
  purchaseCost?: number;
  marginPercent?: number;
  taxRate?: number;
}

export interface PricingResult {
  purchaseCost: number;
  marginPercent: number;
  taxRate: number;
  profitAmount: number;
  netSalePrice: number;
  finalPrice: number;
}

export function calculatePricing(input: PricingInput): PricingResult {
  const purchaseCost = Number.isFinite(Number(input.purchaseCost)) ? Number(input.purchaseCost) : 0;
  const marginPercent = Number.isFinite(Number(input.marginPercent)) ? Number(input.marginPercent) : 0;
  const taxRate = Number.isFinite(Number(input.taxRate)) ? Number(input.taxRate) : 18;

  const profitAmount = purchaseCost * (marginPercent / 100);
  const netSalePrice = purchaseCost + profitAmount;
  const finalPrice = netSalePrice * (1 + taxRate / 100);

  return {
    purchaseCost,
    marginPercent,
    taxRate,
    profitAmount,
    netSalePrice,
    finalPrice,
  };
}

export function resolveCatalogTaxRate(params: { productTaxRate?: number; companyTaxRate?: number; companyCurrency?: string }) {
  const productTax = Number(params.productTaxRate);
  if (Number.isFinite(productTax) && productTax >= 0) return productTax;

  const companyTax = Number(params.companyTaxRate);
  if (Number.isFinite(companyTax) && companyTax >= 0) return companyTax;

  return params.companyCurrency === 'S/' ? 18 : 0;
}

export function taxLabel(params: { taxRate: number; companyCountryCode?: string; companyCurrency?: string }) {
  if (params.taxRate <= 0) return '';
  const isPeru = params.companyCountryCode === 'PE' || params.companyCurrency === 'S/';
  return isPeru ? `+ IGV ${params.taxRate}%` : `+ Impuesto ${params.taxRate}%`;
}

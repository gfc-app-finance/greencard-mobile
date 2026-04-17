import {
  formatCurrencyAmount,
  getCurrencySymbol,
  parseCurrencyAmount,
  splitCurrencyParts,
} from '@/lib/currency';

describe('currency helpers', () => {
  it('parses formatted amounts safely', () => {
    expect(parseCurrencyAmount('NGN 25,000.00')).toBe(25000);
    expect(parseCurrencyAmount('$0.00')).toBe(0);
  });

  it('returns a fallback symbol for known currencies', () => {
    expect(getCurrencySymbol('NGN')).toBe('₦');
    expect(getCurrencySymbol('GBP')).toBe('£');
  });

  it('formats amounts using currency codes', () => {
    expect(formatCurrencyAmount('USD', 250)).toContain('$');
  });

  it('splits major and minor currency parts', () => {
    expect(splitCurrencyParts('₦12,480.00')).toEqual({
      major: '₦12,480',
      minor: '.00',
    });
  });
});

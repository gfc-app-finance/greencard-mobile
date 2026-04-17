const currencyLocales: Record<string, string> = {
  NGN: 'en-NG',
  USD: 'en-US',
  GBP: 'en-GB',
  EUR: 'en-IE',
};

const currencySymbols: Record<string, string> = {
  NGN: '\u20A6',
  USD: '$',
  GBP: '\u00A3',
  EUR: '\u20AC',
};

export function parseCurrencyAmount(value: string) {
  const normalizedValue = value.replace(/[^0-9.]/g, '');
  const parsedValue = Number.parseFloat(normalizedValue);

  if (Number.isNaN(parsedValue)) {
    return 0;
  }

  return parsedValue;
}

export function formatCurrencyAmount(currencyCode: string, amount: number) {
  try {
    return new Intl.NumberFormat(currencyLocales[currencyCode] || 'en-US', {
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      style: 'currency',
    }).format(amount);
  } catch {
    return `${getCurrencySymbol(currencyCode)}${amount.toFixed(2)}`;
  }
}

export function getCurrencySymbol(currencyCode: string) {
  const fallbackSymbol = currencySymbols[currencyCode] || currencyCode;

  try {
    const formatter = new Intl.NumberFormat(currencyLocales[currencyCode] || 'en-US', {
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
      style: 'currency',
    });

    if (typeof formatter.formatToParts === 'function') {
      const parts = formatter.formatToParts(0);
      const symbol = parts.find((part) => part.type === 'currency')?.value;

      if (symbol) {
        return symbol;
      }
    }

    const formattedSample = formatter.format(0);
    const derivedSymbol = formattedSample.replace(/[0-9\s.,]/g, '').trim();

    return derivedSymbol || fallbackSymbol;
  } catch {
    return fallbackSymbol;
  }
}

export function splitCurrencyParts(value: string) {
  const formattedValue = value.trim();
  const match = formattedValue.match(/^(.*\d)(\.\d{1,2})$/);

  if (!match) {
    return {
      major: formattedValue,
      minor: '',
    };
  }

  return {
    major: match[1],
    minor: match[2],
  };
}

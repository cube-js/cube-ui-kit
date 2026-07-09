/**
 * A value acceptable to the date/time formatters. Named `FormatDateInput` (not
 * `DateInput`) to avoid clashing with the exported `DateInput` DatePicker field.
 */
export type FormatDateInput = Date | number | string;

export interface RelativeTimeOptions {
  /** Reference point the value is compared against. Defaults to `Date.now()`. */
  now?: FormatDateInput;
  /** Passed to `Intl.RelativeTimeFormat`. Defaults to `'auto'` ("yesterday"). */
  numeric?: Intl.RelativeTimeFormatNumeric;
  /** Passed to `Intl.RelativeTimeFormat`. Defaults to `'long'`. */
  style?: Intl.RelativeTimeFormatStyle;
}

export interface CurrencyOptions extends Intl.NumberFormatOptions {
  /** ISO 4217 currency code. Defaults to `'USD'`. */
  currency?: string;
}

export interface BytesOptions {
  /** How the unit label is displayed. Defaults to `'short'` ("MB"). */
  unitDisplay?: Intl.NumberFormatOptions['unitDisplay'];
  /** Max fraction digits. Defaults to `1`. */
  maximumFractionDigits?: number;
  /** Min fraction digits. Defaults to `0`. */
  minimumFractionDigits?: number;
}

/** The bundle of locale-bound formatting helpers. */
export interface Formatter {
  /** The BCP-47 locale every helper below formats for. */
  locale: string;
  /** Date only, defaults to `{ dateStyle: 'medium' }` ("Jan 15, 2024"). */
  formatDate: (
    value: FormatDateInput,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  /** Time only, defaults to `{ timeStyle: 'short' }` ("2:30 PM"). */
  formatTime: (
    value: FormatDateInput,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  /** Date + time, defaults to `{ dateStyle: 'medium', timeStyle: 'short' }`. */
  formatDateTime: (
    value: FormatDateInput,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
  /** Relative time via `Intl.RelativeTimeFormat` ("5 minutes ago"). */
  formatRelativeTime: (
    value: FormatDateInput,
    options?: RelativeTimeOptions,
  ) => string;
  /** A number via `Intl.NumberFormat`. */
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** A currency amount, defaults to USD. */
  formatCurrency: (value: number, options?: CurrencyOptions) => string;
  /** A percentage. Input is a fraction: `0.5` → "50%". */
  formatPercent: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** A byte count with a localized, auto-scaled unit ("1.5 MB"). Decimal (1000-based). */
  formatBytes: (value: number, options?: BytesOptions) => string;
  /** A list via `Intl.ListFormat` ("A, B, and C"). */
  formatList: (
    items: Iterable<string>,
    options?: Intl.ListFormatOptions,
  ) => string;
}

type IntlCtor =
  | typeof Intl.DateTimeFormat
  | typeof Intl.NumberFormat
  | typeof Intl.RelativeTimeFormat
  | typeof Intl.ListFormat;

// `Intl.*` constructors are expensive, so instances are memoized by
// locale + kind + options. Shared by both the hook and the pure helpers.
const cache = new Map<string, unknown>();

function getIntl<T>(
  kind: string,
  Ctor: IntlCtor,
  locale: string,
  options: object | undefined,
): T {
  const key = `${locale}|${kind}|${options ? JSON.stringify(options) : ''}`;
  let instance = cache.get(key);

  if (!instance) {
    instance = new (Ctor as new (locale: string, options?: object) => unknown)(
      locale,
      options,
    );
    cache.set(key, instance);
  }

  return instance as T;
}

function toDate(value: FormatDateInput): Date | null {
  const date =
    value instanceof Date ? value : new Date(value as string | number);

  return Number.isNaN(date.getTime()) ? null : date;
}

// Decimal (1000-based) byte units. `Intl` localizes the unit label itself, so we
// only pick which one fits the magnitude.
const BYTE_UNITS = [
  'byte',
  'kilobyte',
  'megabyte',
  'gigabyte',
  'terabyte',
  'petabyte',
] as const;

// Largest-fitting-unit thresholds for relative time. Each `amount` is how many
// of the current unit make up the next one.
const RELATIVE_DIVISIONS: {
  amount: number;
  unit: Intl.RelativeTimeFormatUnit;
}[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

/**
 * Builds a bundle of formatting helpers bound to `locale`. Used by both
 * `useFormatter()` (locale from React Aria context) and the pure top-level
 * helpers (locale from the module mirror). All `Intl.*` instances are memoized.
 */
export function createFormatter(locale: string): Formatter {
  const formatDate: Formatter['formatDate'] = (value, options) => {
    const date = toDate(value);
    if (!date) return '';

    return getIntl<Intl.DateTimeFormat>('date', Intl.DateTimeFormat, locale, {
      dateStyle: 'medium',
      ...options,
    }).format(date);
  };

  const formatTime: Formatter['formatTime'] = (value, options) => {
    const date = toDate(value);
    if (!date) return '';

    return getIntl<Intl.DateTimeFormat>('date', Intl.DateTimeFormat, locale, {
      timeStyle: 'short',
      ...options,
    }).format(date);
  };

  const formatDateTime: Formatter['formatDateTime'] = (value, options) => {
    const date = toDate(value);
    if (!date) return '';

    return getIntl<Intl.DateTimeFormat>('date', Intl.DateTimeFormat, locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      ...options,
    }).format(date);
  };

  const formatRelativeTime: Formatter['formatRelativeTime'] = (
    value,
    options,
  ) => {
    const date = toDate(value);
    if (!date) return '';

    const now = options?.now != null ? toDate(options.now) : new Date();
    if (!now) return '';

    const rtf = getIntl<Intl.RelativeTimeFormat>(
      'relative',
      Intl.RelativeTimeFormat,
      locale,
      {
        numeric: options?.numeric ?? 'auto',
        style: options?.style ?? 'long',
      },
    );

    let duration = (date.getTime() - now.getTime()) / 1000;

    for (const division of RELATIVE_DIVISIONS) {
      if (Math.abs(duration) < division.amount) {
        return rtf.format(Math.round(duration), division.unit);
      }
      duration /= division.amount;
    }

    return rtf.format(Math.round(duration), 'year');
  };

  const formatNumber: Formatter['formatNumber'] = (value, options) =>
    getIntl<Intl.NumberFormat>(
      'number',
      Intl.NumberFormat,
      locale,
      options,
    ).format(value);

  const formatCurrency: Formatter['formatCurrency'] = (value, options) => {
    const { currency = 'USD', ...rest } = options ?? {};

    return getIntl<Intl.NumberFormat>('number', Intl.NumberFormat, locale, {
      style: 'currency',
      currency,
      ...rest,
    }).format(value);
  };

  const formatPercent: Formatter['formatPercent'] = (value, options) =>
    getIntl<Intl.NumberFormat>('number', Intl.NumberFormat, locale, {
      style: 'percent',
      ...options,
    }).format(value);

  const formatBytes: Formatter['formatBytes'] = (value, options) => {
    const sign = value < 0 ? -1 : 1;
    let bytes = Math.abs(value);
    let unitIndex = 0;

    while (bytes >= 1000 && unitIndex < BYTE_UNITS.length - 1) {
      bytes /= 1000;
      unitIndex++;
    }

    return getIntl<Intl.NumberFormat>('number', Intl.NumberFormat, locale, {
      style: 'unit',
      unit: BYTE_UNITS[unitIndex],
      unitDisplay: options?.unitDisplay ?? 'short',
      // Bytes (the base unit) are integers; scaled units get 1 fraction digit.
      minimumFractionDigits: options?.minimumFractionDigits ?? 0,
      maximumFractionDigits:
        options?.maximumFractionDigits ?? (unitIndex === 0 ? 0 : 1),
    }).format(sign * bytes);
  };

  const formatList: Formatter['formatList'] = (items, options) =>
    getIntl<Intl.ListFormat>('list', Intl.ListFormat, locale, options).format(
      items,
    );

  return {
    locale,
    formatDate,
    formatTime,
    formatDateTime,
    formatRelativeTime,
    formatNumber,
    formatCurrency,
    formatPercent,
    formatBytes,
    formatList,
  };
}

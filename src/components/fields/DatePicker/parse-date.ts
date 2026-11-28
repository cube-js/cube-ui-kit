import { parseAbsolute } from '@internationalized/date';

// An ISO 8601 date or date-time with no zone: `2024-01-05`, `2024-01-05T10:30`,
// `2024-01-05 10:30:15.250`.
const ZONELESS_ISO_DATE =
  /^\d{4}-\d{2}-\d{2}(?:[Tt ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/;

// Day 00, which `@internationalized/date` reads as the previous month's last.
const DAY_ZERO = /^\d{4}-\d{2}-00(?!\d)/;

/**
 * Parses a date into a `ZonedDateTime` in UTC. A string with a zone or offset
 * keeps its instant. A `YYYY-MM-DD` date, optionally followed by `T` or a space
 * and `HH:mm[:ss[.sss]]`, with no zone is read as UTC wall time, not in the
 * browser's zone. Other strings `Date` understands are parsed by it.
 * Returns `undefined` for an empty or invalid value.
 */
export function parseAbsoluteDate(val: string | Date | undefined | null) {
  if (!val || (typeof val === 'string' && val.trim() === '')) {
    return undefined;
  }

  if (val instanceof Date) {
    return parseAbsolute(val.toISOString(), 'UTC');
  }

  const zoneless = ZONELESS_ISO_DATE.test(val);
  const hasTime = zoneless && val.length > 10;
  // A zoneless value read as UTC: `YYYY-MM-DDTHH:mm…Z`.
  const utc = zoneless
    ? `${val.slice(0, 10)}T${hasTime ? val.slice(11) : '00:00'}Z`
    : val;

  try {
    if (DAY_ZERO.test(val)) {
      throw new RangeError(`Day 00 in ${val}`);
    }

    return parseAbsolute(utc, 'UTC');
  } catch (e) {
    // `Date` reads a date-only string as UTC but a date-time as local time, so
    // a zoneless one it gets here (such as `T24:00`) keeps its `Z`.
    const fallback = hasTime ? utc : val;

    if (!DAY_ZERO.test(val) && !Number.isNaN(Date.parse(fallback))) {
      return parseAbsolute(new Date(fallback).toISOString(), 'UTC');
    } else {
      console.error('Invalid date format', val);
      return undefined;
    }
  }
}

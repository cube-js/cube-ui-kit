import { parseAbsolute } from '@internationalized/date';

export function parseAbsoluteDate(val: string | Date) {
  if (val instanceof Date) {
    return parseAbsolute(val.toISOString(), 'UTC');
  }

  try {
    parseAbsolute(val, 'UTC');
  } catch (e) {
    if (!Number.isNaN(Date.parse(val))) {
      return parseAbsolute(new Date(val).toISOString(), 'UTC');
    } else {
      console.error('Invalid date format', val);
      return null;
    }
  }
}
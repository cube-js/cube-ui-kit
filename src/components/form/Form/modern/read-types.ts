import type {
  CalendarDate,
  CalendarDateTime,
  Time,
  ZonedDateTime,
} from '@internationalized/date';

type AtomicFormValue =
  | Date
  | RegExp
  | File
  | Blob
  | Map<any, any>
  | Set<any>
  | ((...args: any[]) => any)
  | CalendarDate
  | CalendarDateTime
  | Time
  | ZonedDateTime;

/** Partial immutable data; platform and date-control values stay atomic. */
export type FormReadValue<T> = T extends AtomicFormValue
  ? T
  : T extends object
    ? { readonly [K in keyof T]?: FormReadValue<T[K]> }
    : T;

export type FormValues<T extends object> = FormReadValue<T>;

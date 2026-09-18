/** Immutable, possibly incomplete form data. Opaque platform values stay atomic. */
export type FormReadValue<T> = T extends
  | Date
  | RegExp
  | File
  | Blob
  | Map<any, any>
  | Set<any>
  | ((...args: any[]) => any)
  ? T
  : T extends object
    ? { readonly [K in keyof T]?: FormReadValue<T[K]> }
    : T;

export type FormValues<T extends object> = FormReadValue<T>;

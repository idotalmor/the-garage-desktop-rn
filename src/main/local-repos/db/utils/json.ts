/** JSON helpers for SQLite columns that store nested objects as text. */

declare const jsonOf: unique symbol

/**
 * A TEXT column holding `JSON.stringify` of a `T`, e.g. `Json<GitRemote[]>`. At runtime it is a
 * plain string; the type only records what the JSON contains so `parseJson`/`toJson` are checked.
 */
export type Json<T> = string & { readonly [jsonOf]: T }

/** Parses a JSON column, returning `fallback` when it is null or not valid JSON. */
export function parseJson<T, F = T>(value: Json<T> | null, fallback: F): T | F {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function toJson<T extends object>(value: T): Json<T>
export function toJson<T>(value: T | null): Json<T> | null
export function toJson<T>(value: T | null): Json<T> | null {
  return value == null ? null : (JSON.stringify(value) as Json<T>)
}

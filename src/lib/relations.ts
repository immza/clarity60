/** A relationship value may arrive as an id or as a populated doc; this returns the id. */
export const idOf = (value: unknown): number | string | undefined =>
  value && typeof value === 'object' && 'id' in value
    ? (value as { id: number | string }).id
    : (value as number | string | undefined)

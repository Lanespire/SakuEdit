import { pick } from 'es-toolkit'

export function pickDefined<
  TObject extends Record<string, unknown>,
  const TKeys extends readonly (keyof TObject)[],
>(source: TObject, keys: TKeys) {
  const picked = pick(source, [...keys])

  return Object.fromEntries(
    Object.entries(picked).filter(([, value]) => value !== undefined),
  ) as Partial<Pick<TObject, TKeys[number]>>
}

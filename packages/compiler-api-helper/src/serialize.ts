import type { TypeObject } from './type-object'

type SerializedTypeObject = {
  kind: 'SERIALIZED_TYPE_OBJECT'
  value: string
}

export const serializeTypeObject = (
  typeObject: TypeObject,
): SerializedTypeObject =>
  ({
    kind: 'SERIALIZED_TYPE_OBJECT',
    value: JSON.stringify(typeObject),
  }) as const

export const deserializeTypeObject = (
  serialized: SerializedTypeObject,
): TypeObject => JSON.parse(serialized.value)

import type { Type, __String } from "typescript"

export type MyType = Type & {
  types?: MyType[] // doesn't exist public type def
}

export type BaseType = {
  name?: string
  typeText: string
  props: PropType[]

  union: BaseType[] // for union type
}

export type PropType = BaseType & {
  propName: __String
}

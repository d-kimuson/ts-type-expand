import type { Type } from "typescript"

export type MyType = Type & {
  types?: MyType[] // doesn't exist public type def
}

export type BaseType = {
  name?: string
  typeText: string
  props: PropType[]
  union: BaseType[] // for union type
  typeForProps: MyType | undefined // only properties are expandable
}

export type PropType = BaseType & {
  propName: string
}

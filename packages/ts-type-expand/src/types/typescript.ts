import type ts from 'typescript'

// doesn't exist public type def
export type MyType = ts.Type & {
  types?: MyType[]
  resolvedTypeArguments?: MyType[]
  value?: unknown
}

export type MyNode = ts.Node & {
  type?: ts.TypeNode
  locals?: Map<string, ts.Symbol>
}

export type Type =
  | BaseType
  | PropType
  | FunctionType
  | ArrayType
  | EnumType
  | EnumMemberType

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

export type FunctionType = BaseType & {
  functionName: string
  args: BaseType[]
  returnType: BaseType
}

export type ArrayType = BaseType & {
  arrayName: string
  childType: BaseType
}

// TODO: 他の型も __typename を見るようにしたい
export type EnumType = BaseType & {
  __typename: 'EnumType'
  members: EnumMemberType[]
}

export type EnumMemberType = BaseType & {
  __typename: 'EnumMemberType'
  value: unknown
}

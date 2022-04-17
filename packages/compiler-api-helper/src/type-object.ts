import type * as ts from "typescript"

export type TypeObject =
  | PrimitiveTO
  | LiteralTO
  | SpecialTO
  | ArrayTO
  | TupleTO
  | ObjectTO
  | UnionTO
  | EnumTO
  | CallableTO
  | PromiseTO
  | UnsupportedTO

type WithTypeName = {
  typeName: string
}

export type PrimitiveTO = {
  __type: "PrimitiveTO"
  kind: "string" | "number" | "bigint" | "boolean"
}

export type SpecialTO = {
  __type: "SpecialTO"
  kind: "null" | "undefined" | "any" | "unknown" | "never" | "void" | "Date"
}

export type LiteralTO = {
  __type: "LiteralTO"
  value: unknown
}

export type ArrayTO = WithTypeName & {
  __type: "ArrayTO"
  child: TypeObject
}

export type TupleTO = WithTypeName & {
  __type: "TupleTO"
  items: TypeObject[]
}

export type ObjectTO = WithTypeName & {
  __type: "ObjectTO"
  tsType: ts.Type // to resolve recursive type sequentially
  getProps: () => {
    propName: string
    type: TypeObject
  }[]
}

export type UnionTO = WithTypeName & {
  __type: "UnionTO"
  unions: [TypeObject, TypeObject, ...TypeObject[]]
}

export type EnumTO = WithTypeName & {
  __type: "EnumTO"
  enums: {
    name: string
    type: LiteralTO
  }[]
}

export type CallableArgument = {
  name: string
  type: TypeObject
}

export type CallableTO = {
  __type: "CallableTO"
  argTypes: {
    name: string
    type: TypeObject
    // should support optional arguments?
  }[]
  returnType: TypeObject
}

export type PromiseTO = {
  __type: "PromiseTO"
  child: TypeObject
}

/**
 * @property kind -- identifer of why converted as unsupported
 */
export type UnsupportedTO = {
  __type: "UnsupportedTO"
  kind:
    | "arrayT"
    | "prop"
    | "convert"
    | "function"
    | "unresolvedTypeParameter"
    | "promiseNoArgument"
    | "enumValNotFound"
  typeText?: string
}

export function primitive(kind: PrimitiveTO["kind"]): PrimitiveTO {
  return {
    __type: "PrimitiveTO",
    kind,
  }
}

export function special(kind: SpecialTO["kind"]): SpecialTO {
  return {
    __type: "SpecialTO",
    kind,
  }
}

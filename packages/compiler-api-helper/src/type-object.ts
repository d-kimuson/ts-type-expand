import { ArrayAtLeastN } from "./util"

export type TypeObject =
  | PrimitiveTO
  | LiteralTO
  | SpecialTO
  | ArrayTO
  | TupleTO
  | UnionTO
  | EnumTO
  | CallableTO
  | PromiseTO
  | UnsupportedTO
  | ObjectTO
  | ObjectRefTO

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
  props: {
    propName: string
    type: TypeObject
  }[]
}

export type ObjectRefTO = WithTypeName & {
  __type: "ObjectRefTO"
  typeRef: ObjectTO
}

export type UnionTO = WithTypeName & {
  __type: "UnionTO"
  unions: ArrayAtLeastN<TypeObject, 2>
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

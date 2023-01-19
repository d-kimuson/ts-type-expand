import type { Declaration, ExportSpecifier, Symbol, __String } from "typescript"
import type { Node, Type } from "typescript"
import type { VariableDeclaration } from "typescript"

export class ExtractError extends Error {
  public constructor(public fn: string) {
    super()
  }
}

export const dangerouslyDeclareToEscapedText = (
  declare: VariableDeclaration
): string => {
  if (
    "escapedText" in declare.name &&
    typeof declare.name["escapedText"] === "string"
  ) {
    return declare.name["escapedText"]
  }

  throw new ExtractError("dangerouslyDeclareToEscapedText")
}

export const dangerouslyNodeToSymbol = (node: Node): Symbol | undefined => {
  if ("symbol" in node) {
    return node.symbol as Symbol
  }

  return undefined
}

export const dangerouslyExportSpecifierToEscapedName = (
  element: ExportSpecifier
): __String | undefined => {
  if ("symbol" in element) {
    // @ts-expect-error
    return element.getEscapedName() as __String
  }

  return undefined
}

export const dangerouslyDeclarationToType = (
  declare: Declaration
): Node | undefined => {
  if ("type" in declare) {
    return declare.type as Node
  }

  return undefined
}

export const dangerouslyTypeToNode = (type: Type): Node | undefined => {
  if ("node" in type) {
    return type.node as Node
  }

  return undefined
}

export const dangerouslyTypeToTypes = (type: Type): Type[] => {
  return "types" in type ? (type.types as Type[]) : []
}

export const dangerouslyTypeToResolvedTypeArguments = (type: Type): Type[] => {
  return "resolvedTypeArguments" in type
    ? (type.resolvedTypeArguments as Type[])
    : []
}

import type * as ts from "typescript"
import {
  createProgram,
  forEachChild,
  getNameOfDeclaration,
  SyntaxKind,
  isPropertyName,
  isIdentifier,
  isVariableStatement,
  getPositionOfLineAndCharacter,
} from "typescript"

import type { MyType, BaseType, PropType } from "./types/typescript"
import { loadTsConfig } from "~/utils/tsConfig"

type SupportedNode =
  | ts.TypeAliasDeclaration
  | ts.VariableDeclaration
  | ts.FunctionDeclaration
  | ts.ClassDeclaration
  | ts.InterfaceDeclaration

const isSupportedNode = (node: ts.Node): node is SupportedNode =>
  [
    SyntaxKind.TypeAliasDeclaration,
    SyntaxKind.VariableDeclaration,
    SyntaxKind.FunctionDeclaration,
    SyntaxKind.ClassDeclaration,
    SyntaxKind.InterfaceDeclaration,
  ].includes(node.kind)

type DefinitionNode =
  | ts.TypeAliasDeclaration
  | ts.InterfaceDeclaration
  | ts.FunctionDeclaration
  | ts.ClassDeclaration

const isDefinitionNode = (node: ts.Node): node is DefinitionNode =>
  [
    SyntaxKind.TypeAliasDeclaration,
    SyntaxKind.FunctionDeclaration,
    SyntaxKind.ClassDeclaration,
    SyntaxKind.InterfaceDeclaration,
  ].includes(node.kind)

export class CompilerHandler {
  private program: ts.Program
  private checker: ts.TypeChecker

  constructor(tsConfigPath: string, basePath: string) {
    const tsConfig = loadTsConfig(tsConfigPath, basePath)
    this.program = createProgram(tsConfig.fileNames, tsConfig.options)
    this.checker = this.program.getTypeChecker()
  }

  public getTypeFromLineAndCharacter(
    filePath: string,
    lineNumber: number,
    character: number
  ): BaseType | undefined {
    const sourceFile = this.program.getSourceFile(filePath)
    if (!sourceFile) {
      throw new Error(`File not found: ${filePath}`)
    }

    const pos = getPositionOfLineAndCharacter(sourceFile, lineNumber, character)
    return this.getTypeFromPos(sourceFile, pos)
  }

  private getTypeFromPos(
    sourceFile: ts.SourceFile,
    pos: number
  ): BaseType | undefined {
    const result = this.getNodeFromPos(sourceFile, pos)
    if (!result) {
      return undefined
    }

    const { leafNode } = result

    if (isIdentifier(leafNode)) {
      this.getTypeFromNode(leafNode.parent)
    }

    return this.getTypeFromNode(leafNode)
  }

  public getDeclaredTypesFromFile(
    filePath: string
  ): {
    node: ts.Node
    type: BaseType | undefined
  }[] {
    const sourceFile = this.program.getSourceFile(filePath)
    if (!sourceFile) {
      throw new Error(`File not found: ${filePath}`)
    }

    const types: { node: ts.Node; type: BaseType | undefined }[] = []

    forEachChild(sourceFile, (node) => {
      if (!isSupportedNode) {
        return
      }

      if (isVariableStatement(node)) {
        types.push({
          node: node,
          type: this.getTypeFromVariable(node),
        })
        return
      }

      types.push({
        node: node,
        type: this.getTypeFromNode(node),
      })
    })

    return types
  }

  private getNodeFromPos(
    sourceFile: ts.SourceFile,
    pos: number
  ): { parentNode: ts.Node; leafNode: ts.Node } | undefined {
    let result:
      | { parentNode: ts.Node; leafNode: ts.Node }
      | undefined = undefined

    const getValidChildNodeRecursively = (node: ts.Node): ts.Node => {
      const validChild = node
        .getChildren()
        .find((childNode) => childNode.pos <= pos && pos <= childNode.end)

      if (!validChild) {
        return node
      }
      return getValidChildNodeRecursively(validChild)
    }

    forEachChild(sourceFile, (node) => {
      if (node.pos <= pos && pos <= node.end) {
        result = {
          parentNode: node,
          leafNode: getValidChildNodeRecursively(node),
        }
      }
    })

    return result
  }

  // entry function for converting node to type
  private getTypeFromNode(node: ts.Node): BaseType | undefined {
    if (isDefinitionNode(node)) {
      return this.getTypeFromDefinition(node)
    }
    if (isPropertyName(node)) {
      return this.getTypeFromProperty(node)
    }

    return undefined
  }

  private getTypeFromDefinition(node: DefinitionNode): BaseType {
    return this.convertBaseType(
      this.checker.getTypeAtLocation(node),
      getNameOfDeclaration(node)?.getText()
    )
  }

  private getTypeFromVariable(node: ts.VariableStatement): BaseType {
    const typeNode = node.declarationList.declarations[0]
    return this.convertBaseType(
      this.checker.getTypeAtLocation(typeNode),
      getNameOfDeclaration(typeNode)?.getText()
    )
  }

  private getTypeFromProperty(node: ts.Node): BaseType | undefined {
    if (!isPropertyName(node)) {
      throw new Error("This node is not PropertyName")
    }

    let parentNode: ts.Node = node
    const propNames: string[] = []

    const addPropName = (propName: ts.__String | undefined) => {
      if (!propName) {
        return
      }
      propNames.push(String(propName))
    }

    addPropName(this.checker.getSymbolAtLocation(parentNode)?.escapedName)

    // Back to definition node
    while (!isDefinitionNode(parentNode)) {
      parentNode = parentNode.parent

      if (isPropertyName(parentNode)) {
        addPropName(this.checker.getSymbolAtLocation(parentNode)?.escapedName)
      }
    }

    // Get type of definition node
    const parent = this.getTypeFromNode(parentNode)
    if (typeof parent === "undefined") {
      return undefined
    }

    // property type
    return propNames.reduce((s, propName) => {
      const found = s.props.find((prop) => String(prop.propName) === propName)
      if (found) {
        return found
      }

      // if not found => find property type from union
      const propFromUnion = s.union
        .map((type) =>
          type.props.find((prop) => String(prop.propName) === propName)
        )
        .filter((maybeProp): maybeProp is PropType => maybeProp !== undefined)
        .pop()
      if (propFromUnion) {
        return propFromUnion
      }

      throw new Error("Property not found") // Not reachable
    }, parent)
  }

  // Util
  private convertTypeFromSymbol(symbol: ts.Symbol): MyType {
    return this.checker.getTypeOfSymbolAtLocation(
      symbol,
      (symbol.getDeclarations() ?? [])[0]
    ) as MyType
  }

  private convertBaseType(type: MyType, name?: string): BaseType {
    const union = type?.types ?? []
    const typeText = this.checker.typeToString(type)

    return {
      name,
      typeText,
      props:
        ["string", "number", "boolean", "undefined", "null"].includes(
          typeText
        ) || typeText.endsWith("[]")
          ? []
          : this.getTypeOfProperties(type),
      union: union.map((t) => this.convertBaseType(t)),
    }
  }

  private getTypeOfProperties(type: ts.Type): PropType[] {
    const propSymbols = this.checker.getPropertiesOfType(type)
    return propSymbols.map((propSymbol) => {
      const propType = this.convertTypeFromSymbol(propSymbol)

      return {
        propName: propSymbol.escapedName,
        ...this.convertBaseType(propType),
      }
    })
  }
}

import type * as ts from "typescript"
import {
  createProgram,
  forEachChild,
  getNameOfDeclaration,
  SyntaxKind,
  isPropertyName,
  isPropertySignature,
  isIdentifier,
  isEnumDeclaration,
  isVariableDeclaration,
  isVariableStatement,
  isTypeReferenceNode,
  isImportSpecifier,
  isFunctionDeclaration,
  isArrowFunction,
  isFunctionExpression,
  isMethodDeclaration,
  isTypeAliasDeclaration,
  getPositionOfLineAndCharacter,
} from "typescript"

import type {
  MyType,
  MyNode,
  BaseType,
  PropType,
  FunctionType,
  Type,
  EnumMemberType,
  EnumType,
} from "./types/typescript"
import { loadTsConfig } from "~/utils/tsConfig"
import { watchCompiler } from "~/watchCompiler"

type SupportedNode = MyNode &
  (
    | ts.TypeAliasDeclaration
    | ts.VariableDeclaration
    | ts.FunctionDeclaration
    | ts.ClassDeclaration
    | ts.InterfaceDeclaration
    | ts.PropertyDeclaration
    | ts.MethodDeclaration
    | ts.ImportSpecifier
    | ts.EnumDeclaration
    | ts.EnumMember
  )

const isSupportedNode = (node: ts.Node): node is SupportedNode =>
  [
    SyntaxKind.TypeAliasDeclaration,
    SyntaxKind.VariableDeclaration,
    SyntaxKind.FunctionDeclaration,
    SyntaxKind.ClassDeclaration,
    SyntaxKind.InterfaceDeclaration,
    SyntaxKind.PropertyDeclaration,
    SyntaxKind.MethodDeclaration,
    SyntaxKind.ImportSpecifier,
    SyntaxKind.EnumDeclaration,
    SyntaxKind.EnumMember,
  ].includes(node.kind)

type DefinitionNode = MyNode &
  (
    | ts.TypeAliasDeclaration
    | ts.InterfaceDeclaration
    | ts.ClassDeclaration
    | ts.PropertyDeclaration
  )

const isDefinitionNode = (node: ts.Node): node is DefinitionNode =>
  [
    SyntaxKind.TypeAliasDeclaration,
    SyntaxKind.ClassDeclaration,
    SyntaxKind.InterfaceDeclaration,
    SyntaxKind.PropertyDeclaration,
  ].includes(node.kind)

const isTypeKeyword = (node: ts.Node): boolean =>
  [
    SyntaxKind.AnyKeyword,
    SyntaxKind.BigIntKeyword,
    SyntaxKind.BooleanKeyword,
    SyntaxKind.IntrinsicKeyword,
    SyntaxKind.NeverKeyword,
    SyntaxKind.NumberKeyword,
    SyntaxKind.ObjectKeyword,
    SyntaxKind.StringKeyword,
    SyntaxKind.SymbolKeyword,
    SyntaxKind.UndefinedKeyword,
    SyntaxKind.UnknownKeyword,
    SyntaxKind.VoidKeyword,
  ].includes(node.kind)

export class CompilerHandler {
  private program: ts.Program
  private checker: ts.TypeChecker
  private watchConf?: ts.WatchOfConfigFile<ts.SemanticDiagnosticsBuilderProgram>

  constructor(private tsConfigPath: string) {
    // following properties are not initalized by constructor
    // but they are not possible to be undefined after startWatch()
    this.program = undefined as unknown as ts.Program
    this.checker = undefined as unknown as ts.TypeChecker
  }

  public startWatch(): void {
    this.watchConf = watchCompiler(
      this.tsConfigPath, // eslint-disable-next-line @typescript-eslint/no-empty-function
      () => {},
      () => {
        this.updateProgramByWatch()
      }
    )

    // Initialize Program & Checker
    this.updateProgramByWatch()
  }

  public closeWatch(): void {
    this.watchConf?.close()
  }

  private checkProgram() {
    // Should be called all public method
    if (typeof this.program === "undefined") {
      throw new Error(
        "Program should not be undefined (you must run startWatch before using or initializeWithoutWatch)"
      )
    }
  }

  private updateProgramByWatch() {
    const maybeProgram = this.watchConf?.getProgram().getProgram()
    if (!maybeProgram) {
      console.warn("program is not found")
      return
    }

    this.program = maybeProgram
    this.checker = this.program.getTypeChecker()
    console.log("program & checker config is updated!")
  }

  // Initialize Program For Cli Usage
  public initializeWithoutWatch(basePath: string): void {
    const tsConfig = loadTsConfig(this.tsConfigPath, basePath)
    this.program = createProgram(tsConfig.fileNames, tsConfig.options)
    this.checker = this.program.getTypeChecker()
  }

  public getTypeFromLineAndCharacter(
    filePath: string,
    lineNumber: number,
    character: number
  ): BaseType | undefined {
    this.checkProgram()

    const sourceFile = this.program.getSourceFile(filePath)
    if (!sourceFile) {
      if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
        throw new Error(`File not found: ${filePath}`)
      } else {
        return undefined
      }
    }
    let pos: number
    try {
      pos = getPositionOfLineAndCharacter(sourceFile, lineNumber, character)
    } catch (error) {
      return undefined
    }
    const nodes = this.getNodeFromPos(sourceFile, pos)

    if (!nodes) {
      return undefined
    }

    if (isTypeKeyword(nodes.leafNode)) {
      return this.getTypeFromTypeKeywordNode(nodes.leafNode)
    }

    if (isIdentifier(nodes.leafNode)) {
      return this.getTypeFromIdentifer(nodes.leafNode)
    }

    return undefined
  }

  private getTypeFromIdentifer(
    identiferNode: ts.Identifier
  ): BaseType | undefined {
    // TODO: Integrate into SupportedNode implementation
    // property identifer
    if (isPropertySignature(identiferNode.parent)) {
      return this.getTypeFromProperty(identiferNode)
    }

    if (isSupportedNode(identiferNode.parent)) {
      // declare identifer
      return this.getTypeFromNode(identiferNode.parent)
    }

    return this.convertBaseType(
      this.checker.getTypeAtLocation(identiferNode),
      identiferNode.getText()
    )
  }

  public getDeclaredTypesFromFile(filePath: string): {
    node: ts.Node
    type: BaseType | undefined
  }[] {
    this.checkProgram()

    const sourceFile = this.program.getSourceFile(filePath)
    if (!sourceFile) {
      throw new Error(`File not found: ${filePath}`)
    }

    const types: { node: ts.Node; type: BaseType | undefined }[] = []

    forEachChild(sourceFile, (node) => {
      if (!isSupportedNode(node)) {
        return
      }

      if (isVariableStatement(node)) {
        types.push({
          node: node,
          type: this.getTypeFromVariableStatement(node),
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

  // WARN: Only for debug & tests
  public expandTypeRecursively<T extends BaseType>(type: T): void {
    const f = (t: BaseType): void => {
      if (t.union.length === 0) {
        t.union.forEach((unionType) => f(unionType))
      }

      const propType = t.typeForProps
      if (typeof propType !== "undefined") {
        t.props = this.getTypeOfProperties(propType)
      }

      t.props.map((prop) => f(prop))
    }

    f(type)
  }

  private getNodeFromPos(
    sourceFile: ts.SourceFile,
    pos: number
  ): { parentNode: ts.Node; leafNode: ts.Node } | undefined {
    let result: { parentNode: ts.Node; leafNode: ts.Node } | undefined =
      undefined

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
  private getTypeFromNode(node: SupportedNode): BaseType | undefined {
    if (isEnumDeclaration(node)) {
      return this.getTypeFromEnum(node)
    }
    if (isImportSpecifier(node)) {
      return this.getTypeFromImportSpecifier(node)
    }
    if (isFunctionDeclaration(node) || isMethodDeclaration(node)) {
      return this.getTypeFromFunctionDeclare(
        node as MyNode & (ts.FunctionDeclaration | ts.MethodDeclaration)
      )
    }
    if (isTypeAliasDeclaration(node)) {
      const typeNode = node.type as ts.TypeNode & ts.Declaration & MyNode

      if (typeNode.type && typeNode.locals) {
        return this.getTypeOfFunction(typeNode)
      }
    }

    if (isDefinitionNode(node)) {
      return this.getTypeFromDefinition(node)
    }
    if (isPropertyName(node)) {
      return this.getTypeFromProperty(node)
    }
    if (isVariableDeclaration(node)) {
      return this.getTypeFromVariable(node)
    }
    if (isTypeReferenceNode(node)) {
      return this.getTypeFromTypeReference(node)
    }

    return this.convertBaseType(
      this.checker.getTypeAtLocation(node),
      getNameOfDeclaration(node)?.getText()
    )
  }

  private getTypeFromEnumMember(node: ts.EnumMember): EnumMemberType {
    const type = this.checker.getTypeAtLocation(node) as MyType

    return {
      ...this.convertBaseType(type, getNameOfDeclaration(node)?.getText()),
      __typename: "EnumMemberType",
      typeForProps: undefined,
      value: type.value,
    }
  }

  private getTypeFromEnum(node: ts.EnumDeclaration): EnumType {
    const name = getNameOfDeclaration(node)?.getText() as string

    return {
      name,
      typeText: name || "",
      props: [],
      typeForProps: undefined,
      union: [],
      __typename: "EnumType",
      members: node.members.map((member) =>
        this.getTypeFromEnumMember(member as ts.EnumMember)
      ),
    }
  }

  private getTypeFromDefinition(node: DefinitionNode): BaseType {
    return this.convertBaseType(
      this.checker.getTypeAtLocation(node),
      getNameOfDeclaration(node)?.getText()
    )
  }

  private getTypeFromFunctionDeclare(
    node: MyNode & (ts.FunctionDeclaration | ts.MethodDeclaration)
  ): FunctionType {
    return this.getTypeOfFunction(node)
  }

  private getTypeFromImportSpecifier(node: ts.ImportSpecifier): BaseType {
    return {
      name: getNameOfDeclaration(node)?.getText(),
      typeText: this.typeToString(this.checker.getTypeAtLocation(node)),
      props: this.getTypeOfMembers(node),
      typeForProps: undefined,
      union: [],
    }
  }

  private getTypeFromTypeReference(node: ts.TypeReferenceNode): BaseType {
    return this.convertBaseType(
      this.checker.getTypeFromTypeNode(node),
      node.typeName.getText()
    )
  }

  private getTypeFromTypeKeywordNode(node: ts.Node): BaseType {
    return {
      name: undefined,
      typeText: node.getText(),
      props: [],
      union: [],
      typeForProps: undefined,
    }
  }

  private getTypeFromVariable(node: ts.VariableDeclaration): BaseType {
    const initializer = node.initializer
    // Allow Function
    if (
      initializer &&
      (isArrowFunction(initializer) || isFunctionExpression(initializer))
    ) {
      return this.getTypeOfFunction(
        initializer,
        getNameOfDeclaration(node)?.getText()
      )
    }

    // Others
    return this.convertBaseType(
      this.checker.getTypeAtLocation(node),
      getNameOfDeclaration(node)?.getText()
    )
  }

  private getTypeFromVariableStatement(node: ts.VariableStatement): BaseType {
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

    const symbol = this.checker.getSymbolAtLocation(node)

    return typeof symbol !== "undefined"
      ? this.convertBaseType(
          this.checker.getTypeOfSymbolAtLocation(symbol, node),
          String(symbol.escapedName)
        )
      : undefined
  }

  // Util
  private convertTypeFromSymbol(symbol: ts.Symbol): MyType {
    return this.checker.getTypeOfSymbolAtLocation(
      symbol,
      (symbol.getDeclarations() ?? [])[0]
    ) as MyType
  }

  private convertBaseType(type: MyType, name?: string): Type {
    const union = type?.types ?? []
    const typeText = this.typeToString(type)

    // EnumMember
    if (typeof type?.value !== "undefined") {
      return {
        __typename: "EnumMemberType",
        name,
        typeText: typeText,
        typeForProps: undefined,
        props: [],
        union: [],
        value: type.value,
      }
    }

    // ArrayType
    if (
      typeText.endsWith("[]") &&
      type.resolvedTypeArguments &&
      type.resolvedTypeArguments.length === 1
    ) {
      const arrayName = typeText.slice(0, typeText.length - 2)
      const childType = this.convertBaseType(type.resolvedTypeArguments[0])

      return {
        name,
        typeText,
        props: [],
        typeForProps: undefined,
        union: [],
        arrayName,
        childType,
      }
    }

    // Union Type
    if (type.isUnion() && typeText !== "boolean") {
      return {
        name,
        typeText,
        props: [],
        typeForProps: undefined,
        union: union.map((t) => this.convertBaseType(t)),
      }
    }

    // Basic (expand properties)
    return {
      name,
      typeText,
      props: [],
      typeForProps:
        [
          "string",
          "number",
          "boolean",
          "undefined",
          "null",
          "void",
          "true",
          "false",
          "object",
          "any",
        ].includes(typeText) ||
        (typeText.startsWith('"') && typeText.endsWith('"'))
          ? undefined
          : type,
      union: [],
    }
  }

  private getTypeOfFunction(
    node: MyNode & ts.Declaration,
    functionName?: string
  ) {
    // Args Type
    const args: BaseType[] = []
    const convertBaseType = (type: MyType, name?: string): BaseType => {
      return this.convertBaseType(type, name)
    }

    node?.locals?.forEach((symbol, key) => {
      const argType = this.convertTypeFromSymbol(symbol)
      args.push({
        ...convertBaseType(argType),
        name: key,
      })
    })

    // Return Type
    const returnType = node.type
      ? this.convertBaseType(this.checker.getTypeAtLocation(node.type))
      : {
          typeText: "void",
          props: [],
          union: [],
          typeForProps: undefined,
        }

    // Function Name
    const name = functionName ?? getNameOfDeclaration(node)?.getText()

    return {
      ...this.convertBaseType(this.checker.getTypeAtLocation(node), name),
      functionName: name ?? "",
      args,
      returnType: returnType,
    }
  }

  public getTypeOfProperties(type: ts.Type): PropType[] {
    // Not support `typeof <ClassName>`
    const propSymbols = this.checker.getPropertiesOfType(type)
    return propSymbols.map((propSymbol) => {
      const propType = this.convertTypeFromSymbol(propSymbol)

      return {
        propName: String(propSymbol.escapedName),
        ...this.convertBaseType(propType),
      }
    })
  }

  private getTypeOfMembers(node: ts.ImportSpecifier): PropType[] {
    // Not support Generics
    const props: PropType[] = []
    const getTypeOfFunction = (
      node: MyNode & ts.Declaration,
      functionName?: string
    ) => {
      return this.getTypeOfFunction(node, functionName)
    }
    this.checker
      .getTypeAtLocation(node)
      .symbol.members?.forEach((memberSymbol) => {
        if (memberSymbol.escapedName === "__constructor") {
          return
        }

        const propName = String(memberSymbol.escapedName)

        const declare = memberSymbol.declarations
          ? memberSymbol.declarations[0]
          : undefined
        if (typeof declare !== "undefined" && isMethodDeclaration(declare)) {
          props.push({
            ...getTypeOfFunction(declare),
            propName,
          })
          return
        }

        const propType = this.convertTypeFromSymbol(memberSymbol)
        props.push({
          propName,
          ...this.convertBaseType(propType),
        })
      })

    return props
  }

  private typeToString(type: ts.Type) {
    return this.checker.typeToString(type).replace("typeof ", "")
  }
}

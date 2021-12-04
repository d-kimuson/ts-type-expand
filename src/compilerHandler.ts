import type ts from "typescript"
import { TypeObject } from "compiler-api-helper"

import {
  createProgram,
  forEachChild,
  getPositionOfLineAndCharacter,
  unescapeLeadingUnderscores,
} from "typescript"
import CompilerApiHelper from "compiler-api-helper"

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

export class CompilerHandler {
  private program: ts.Program
  private checker: ts.TypeChecker
  private helper: CompilerApiHelper
  private watchConf?: ts.WatchOfConfigFile<ts.SemanticDiagnosticsBuilderProgram>

  constructor(private tsConfigPath: string) {
    // following properties are not initialized by constructor
    // but they are not possible to be undefined after startWatch()
    this.program = undefined as unknown as ts.Program
    this.checker = undefined as unknown as ts.TypeChecker
    this.helper = undefined as unknown as CompilerApiHelper
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
    if (typeof this.helper === "undefined") {
      this.helper = new CompilerApiHelper(this.program)
    } else {
      this.helper.updateProgram(this.program)
    }
    console.log("program & checker config is updated!")
  }

  // Initialize Program For Cli Usage
  public initializeWithoutWatch(basePath: string): void {
    const tsConfig = loadTsConfig(this.tsConfigPath, basePath)
    this.program = createProgram(tsConfig.fileNames, tsConfig.options)
    this.checker = this.program.getTypeChecker()
    this.helper = new CompilerApiHelper(this.program)
  }

  public getTypeFromLineAndCharacter(
    filePath: string,
    lineNumber: number,
    character: number
  ): [string | undefined, TypeObject] | undefined {
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
    const maybeNode = this.getNodeFromPos(sourceFile, pos)

    if (!maybeNode) {
      return undefined
    }

    const tsType = this.checker.getTypeAtLocation(maybeNode)
    // @ts-expect-error no typedef but it exists
    if ("intrinsicName" in tsType && tsType.intrinsicName === "error") {
      return undefined
    }
    const escapedName = this.checker
      .getSymbolAtLocation(maybeNode)
      ?.getEscapedName()
    return [
      escapedName ? unescapeLeadingUnderscores(escapedName) : undefined,
      this.helper.convertType(tsType),
    ]
  }

  private getNodeFromPos(
    sourceFile: ts.SourceFile,
    pos: number
  ): ts.Node | undefined {
    let result: ts.Node | undefined = undefined

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
        result = getValidChildNodeRecursively(node)
      }
    })

    return result
  }
}

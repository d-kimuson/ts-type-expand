import type * as ts from "typescript"
import { TypeObject } from "compiler-api-helper"

import {
  forEachChild,
  getPositionOfLineAndCharacter,
  unescapeLeadingUnderscores,
} from "typescript"
import CompilerApiHelper from "compiler-api-helper"

export class CompilerHandler {
  private checker: ts.TypeChecker
  private helper: CompilerApiHelper

  constructor(private program: ts.Program) {
    this.checker = this.program.getTypeChecker()
    this.helper = new CompilerApiHelper(this.program)
  }

  public updateProgram(program: ts.Program): void {
    this.program = program
    this.checker = this.program.getTypeChecker()
    this.helper.updateProgram(this.program)
    console.log("program & checker config is updated!")
  }

  private checkProgram() {
    // Should be called all public method
    if (typeof this.program === "undefined") {
      throw new Error(
        "Program should not be undefined (you must run startWatch before using or initializeWithoutWatch)"
      )
    }
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
        throw new Error(`SourceFile not found: ${filePath}`)
      } else {
        throw new Error(`File extension is not supported: ${filePath}`)
      }
    }
    let pos: number
    try {
      pos = getPositionOfLineAndCharacter(sourceFile, lineNumber, character)
    } catch (error) {
      throw error
    }
    const maybeNode = this.getNodeFromPos(sourceFile, pos)

    if (!maybeNode) {
      throw new Error("Node is not defined")
    }

    const tsType = this.checker.getTypeAtLocation(maybeNode)
    if ("intrinsicName" in tsType && tsType.intrinsicName === "error") {
      throw new Error(`Unexpected intrinsicName Error, ${tsType.toString()}`)
      // return undefined
    }
    const escapedName = this.checker
      .getSymbolAtLocation(maybeNode)
      ?.getEscapedName()
    return [
      escapedName ? unescapeLeadingUnderscores(escapedName) : undefined,
      this.helper.convertType(tsType),
    ]
  }

  public getObjectProps(
    storeKey: string
  ): { propName: string; type: TypeObject }[] {
    return this.helper.getObjectProps(storeKey)
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

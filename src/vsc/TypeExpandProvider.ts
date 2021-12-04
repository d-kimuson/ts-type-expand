import vscode from "vscode"
import fs from "fs"

import { CompilerHandler } from "~/compilerHandler"
import { getTsconfigPath, getActiveWorkspace } from "~/utils/vscode"
import { TypeObject } from "compiler-api-helper"

export type TypeExpandProviderOptions = {
  compactOptionalType: boolean
  compactPropertyLength: number
  directExpandArray: boolean
}

class CompilerHandlerStore {
  // put undefined to prevent re-initialization once it has failed.
  static compilerHandlerMap: Record<number, CompilerHandler | undefined> = {}

  static fetchHandler(): CompilerHandler | undefined {
    const workspcae = getActiveWorkspace()

    if (!workspcae) {
      return undefined
    }

    if (workspcae.index in CompilerHandlerStore.compilerHandlerMap) {
      return CompilerHandlerStore.compilerHandlerMap[workspcae.index]
    }

    const handler = CompilerHandlerStore.createHandler()
    CompilerHandlerStore.compilerHandlerMap[workspcae.index] = handler
    return handler
  }

  static createHandler(): CompilerHandler | undefined {
    const tsconfigPath = getTsconfigPath()
    if (!fs.existsSync(tsconfigPath)) {
      vscode.window.showErrorMessage(
        "tsconfig.json doesn't exist.\n" +
          "Please make sure that tsconfig.json is placed under the workspace or ts-type-expand.tsconfigPath is set correctly."
      )
      return undefined
    }

    const handler = new CompilerHandler(tsconfigPath)
    handler.startWatch()
    return handler
  }

  static deleteHandler() {
    const workspcae = getActiveWorkspace()
    if (!workspcae) {
      return
    }
    this.fetchHandler()?.closeWatch()
    delete this.compilerHandlerMap[workspcae.index]
  }

  static deleteAll() {
    Object.keys(this.compilerHandlerMap).forEach((key) => {
      this.fetchHandler()?.closeWatch()
      // @ts-expect-error
      delete this.compilerHandlerMap[key]
    })
  }

  static isActive() {
    return CompilerHandlerStore.fetchHandler() !== undefined
  }
}

export class TypeExpandProvider
  implements vscode.TreeDataProvider<ExpandableTypeItem>
{
  private selection?: vscode.Range
  private selectedType?: {
    declareName?: string
    type: TypeObject
  }
  private activeFilePath: string | undefined

  constructor(options: TypeExpandProviderOptions) {
    this.updateOptions(options)
  }

  public updateOptions(options: TypeExpandProviderOptions): void {
    ExpandableTypeItem.updateOptions(options)
  }

  public restart(): void {
    CompilerHandlerStore.deleteHandler()
    this.refresh()
  }

  public isActive(): boolean {
    return CompilerHandlerStore.isActive()
  }

  getTreeItem(element: ExpandableTypeItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: ExpandableTypeItem): Thenable<ExpandableTypeItem[]> {
    if (!this.isActive) {
      vscode.window.showInformationMessage("Empty workspace")
      return Promise.resolve([])
    }

    if (!this.selectedType) {
      return Promise.resolve([])
    }

    return element
      ? Promise.resolve(element.getChildrenItems())
      : Promise.resolve([
          new ExpandableTypeItem(this.selectedType.type, {
            aliasName: this.selectedType.declareName,
          }),
        ])
  }

  updateSelection(selection: vscode.Selection): void {
    const compilerHandler = CompilerHandlerStore.fetchHandler()

    if (typeof compilerHandler === "undefined") {
      return
    }

    if (!this.activeFilePath) {
      vscode.window.showWarningMessage(
        "The file you are editing cannot be found."
      )
      return
    }

    if (this.selection === selection) {
      // selected node has not changed.
      return
    }

    this.selection = selection

    try {
      const result = compilerHandler.getTypeFromLineAndCharacter(
        this.activeFilePath,
        this.selection?.start.line,
        this.selection?.start.character
      )
      if (!result) {
        return
      }
      this.selectedType = {
        declareName: result[0],
        type: result[1],
      }

      if (this.selectedType) {
        this.refresh()
      }
    } catch (error) {
      const typedError = error as unknown as Error
      vscode.window.showErrorMessage(typedError.message)
    }
  }

  public updateActiveFile(activeFilePath: string | undefined): void {
    this.activeFilePath = activeFilePath
    this.resetSelection()
    this.refresh()
  }

  private resetSelection() {
    this.selection = undefined
    this.selectedType = undefined
  }

  private _onDidChangeTreeData: vscode.EventEmitter<
    ExpandableTypeItem | undefined | null | void
  > = new vscode.EventEmitter<ExpandableTypeItem | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<
    ExpandableTypeItem | undefined | null | void
  > = this._onDidChangeTreeData.event

  refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  close(): void {
    CompilerHandlerStore.deleteAll()
  }
}

type Kind = "Union" | "Properties" | "Function" | "Array" | "Enum" | undefined

function getKindText(type: TypeObject): Kind {
  if (type.__type === "UnionTO") {
    return "Union"
  }
  if (type.__type === "EnumTO") {
    return "Enum"
  }
  if (type.__type === "CallableTO") {
    return "Function"
  }
  if (type.__type === "ArrayTO") {
    return "Array"
  }
  if (type.__type === "ObjectTO") {
    return "Properties"
  }
  return undefined
}

const COMPACT_TEXT = "{...}"

function isExpandable(type: TypeObject): boolean {
  return (
    type.__type === "UnionTO" ||
    type.__type === "EnumTO" ||
    type.__type === "ObjectTO" ||
    type.__type === "ArrayTO" ||
    type.__type === "CallableTO" ||
    type.__type === "PromiseTO"
  )
}

function getLabelText(type: TypeObject): string {
  const typeText = toTypeText(type)

  return typeText.length > ExpandableTypeItem.options.compactPropertyLength
    ? COMPACT_TEXT
    : typeText
}

function toTypeText(type: TypeObject): string {
  if (
    type.__type === "UnionTO" ||
    type.__type === "ArrayTO" ||
    type.__type === "TupleTO" ||
    type.__type === "ObjectTO" ||
    type.__type === "EnumTO"
  ) {
    return type.typeName
  }

  if (type.__type === "UnsupportedTO") {
    return type.typeText ?? "unknown"
  }

  if (type.__type === "CallableTO") {
    return `(${type.argTypes
      .map(({ name, type }) => `${name}: ${toTypeText(type)}`)
      .join(", ")}) => ${toTypeText(type.returnType)}`
  }

  if (type.__type === "PromiseTO") {
    return `Promise<${toTypeText(type.child)}>`
  }

  if (type.__type === "PrimitiveTO") {
    return type.kind
  }

  if (type.__type === "LiteralTO") {
    return String(type.value)
  }

  if (type.__type === "SpecialTO") {
    return type.kind
  }

  throw new Error("unreachable here")
}

class ExpandableTypeItem extends vscode.TreeItem {
  public static options: TypeExpandProviderOptions

  constructor(
    private type: TypeObject,
    meta?: {
      parent?: TypeObject
      aliasName?: string
      desc?: string
    }
  ) {
    super(
      typeof meta?.aliasName !== "undefined" &&
        meta.aliasName !== getLabelText(type)
        ? `${meta.aliasName}: ${getLabelText(type)}`
        : getLabelText(type),
      isExpandable(type)
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    )

    const kind = getKindText(this.type)
    this.description = [
      meta?.desc,
      kind,
      this.type.__type === "ArrayTO" &&
      ExpandableTypeItem.options.directExpandArray
        ? getKindText(this.type.child)
        : undefined,
    ]
      .filter((temp) => typeof temp !== "undefined")
      .join(" ")
    this.tooltip = this.label === COMPACT_TEXT ? toTypeText(type) : undefined
  }

  static updateOptions(options: TypeExpandProviderOptions) {
    ExpandableTypeItem.options = options
  }

  getChildrenItems(): ExpandableTypeItem[] {
    if (this.type.__type === "CallableTO") {
      return [
        ...this.type.argTypes.map(
          ({ name, type }, index) =>
            new ExpandableTypeItem(type, {
              aliasName: name,
              parent: this.type,
              desc: `Arg${index}`,
            })
        ),
        new ExpandableTypeItem(this.type.returnType, {
          parent: this.type,
          desc: "ReturnType",
        }),
      ]
    }

    if (this.type.__type === "ArrayTO") {
      const childItem = new ExpandableTypeItem(this.type.child)

      return ExpandableTypeItem.options.directExpandArray
        ? childItem.getChildrenItems()
        : [childItem]
    }

    if (this.type.__type === "EnumTO") {
      return this.type.enums.map(
        ({ type, name }) =>
          new ExpandableTypeItem(type, { parent: this.type, desc: name })
      )
    }

    if (this.type.__type === "UnionTO") {
      return this.type.unions.map(
        (type) => new ExpandableTypeItem(type, { parent: type })
      )
    }

    if (this.type.__type === "ObjectTO") {
      return this.type.getProps().map(
        ({ propName, type }) =>
          new ExpandableTypeItem(type, {
            aliasName: propName,
            parent: this.type,
          })
      )
    }

    return []
  }
}

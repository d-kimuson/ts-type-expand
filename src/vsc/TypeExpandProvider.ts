import vscode from "vscode"
import fs from "fs"

import type { BaseType, PropType, Type } from "~/types/typescript"
import { CompilerHandler } from "~/compilerHandler"
import { getTsconfigPath, getActiveWorkspace } from "~/utils/vscode"

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
  private selectedType?: BaseType
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
      : Promise.resolve([new ExpandableTypeItem(this.selectedType)])
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
      this.selectedType = compilerHandler.getTypeFromLineAndCharacter(
        this.activeFilePath,
        this.selection?.start.line,
        this.selection?.start.character
      )

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

function getKindText(type: Type): Kind {
  if ("__typename" in type && type.__typename === "EnumType") {
    return "Enum"
  }

  if ("functionName" in type) {
    return "Function"
  }

  if (type.union.length !== 0) {
    return "Union"
  }

  if ("arrayName" in type) {
    return "Array"
  }

  return isExpandable(type) ? "Properties" : undefined
}

function convertOptionalType(type: PropType): PropType {
  const others = type.union.filter((t) => t.typeText !== "undefined")

  if (others.length === type.union.length) {
    return type
  }

  if (others.length === 1) {
    return {
      ...type,
      propName: type.propName + "?",
      typeText: type.typeText.replace(" | undefined", ""),
      union: [],
      props: others[0].props,
      typeForProps: others[0].typeForProps,
    }
  }

  return {
    ...type,
    propName: type.propName + "?",
    union: others,
  }
}

function isUnion(type: BaseType): boolean {
  return type.union.length !== 0
}

function isExpandable(type: Type): boolean {
  return (
    type.union.length !== 0 ||
    type.props.length !== 0 ||
    (typeof type.typeForProps !== "undefined" &&
      CompilerHandlerStore.fetchHandler()?.getTypeOfProperties(
        type.typeForProps
      ).length !== 0) ||
    "functionName" in type ||
    "arrayName" in type ||
    ("__typename" in type && type.__typename === "EnumType")
  )
}

const COMPACT_TEXT = "{...}"

function getLabel(type: Type): string {
  const isExpand = isExpandable(type)
  if ("propName" in type) {
    if (isExpand) {
      return type.propName
    }

    return type.propName ? `${type.propName}: ${type.typeText}` : type.typeText
  }

  if ("__typename" in type && type.__typename === "EnumMemberType") {
    return `${type.typeText} (${type.value})`
  }

  if (isExpand) {
    return (
      type.name ??
      (type.typeText.length > ExpandableTypeItem.options.compactPropertyLength
        ? COMPACT_TEXT
        : type.typeText)
    )
  }

  return type.name ? `${type.name}: ${type.typeText}` : type.typeText
}

class ExpandableTypeItem extends vscode.TreeItem {
  // public static compilerHandler: CompilerHandler
  public static options: TypeExpandProviderOptions

  constructor(private type: Type, desc?: string) {
    super(
      getLabel(type),
      isExpandable(type)
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    )

    const kind = getKindText(this.type)
    this.description = [
      desc,
      kind,
      "arrayName" in this.type && ExpandableTypeItem.options.directExpandArray
        ? getKindText(this.type.childType)
        : undefined,
    ]
      .filter((temp) => typeof temp !== "undefined")
      .join(" ")
    this.tooltip = this.label === COMPACT_TEXT ? type.typeText : undefined
  }

  static updateOptions(options: TypeExpandProviderOptions) {
    ExpandableTypeItem.options = options
  }

  getChildrenItems(): ExpandableTypeItem[] {
    if ("functionName" in this.type) {
      return [
        ...this.type.args.map(
          (argType, index) => new ExpandableTypeItem(argType, `Arg${index + 1}`)
        ),
        new ExpandableTypeItem(this.type.returnType, "Return"),
      ]
    }

    if ("arrayName" in this.type) {
      const childItem = new ExpandableTypeItem(this.type.childType)

      return ExpandableTypeItem.options.directExpandArray
        ? childItem.getChildrenItems()
        : [childItem]
    }

    if ("__typename" in this.type && this.type.__typename === "EnumType") {
      return this.type.members.map((member) => {
        return new ExpandableTypeItem(member)
      })
    }

    return isUnion(this.type)
      ? this.getUnionTypes().map(
          (unionType) => new ExpandableTypeItem(unionType)
        )
      : this.getPropTypes().map((propType) => {
          return new ExpandableTypeItem(
            ExpandableTypeItem.options.compactOptionalType
              ? convertOptionalType(propType)
              : propType
          )
        })
  }

  getPropTypes(): PropType[] {
    return this.type.props.length !== 0
      ? this.type.props
      : this.type.typeForProps
      ? CompilerHandlerStore.fetchHandler()?.getTypeOfProperties(
          this.type.typeForProps
        ) ?? []
      : []
  }

  getUnionTypes(): BaseType[] {
    return this.type.union
  }

  isUnion(): boolean {
    return this.type.union.length !== 0
  }
}

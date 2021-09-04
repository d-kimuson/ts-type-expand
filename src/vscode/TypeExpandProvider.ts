import * as vscode from "vscode"
import * as path from "path"
import * as fs from "fs"

import type { BaseType, PropType, Type } from "~/types/typescript"
import { CompilerHandler } from "~/CompilerHandler"

export type TypeExpandProviderOptions = {
  compactOptionalType: boolean
  compactPropertyLength: number
  directExpandArray: boolean
}

export class TypeExpandProvider
  implements vscode.TreeDataProvider<ExpandableTypeItem> {
  private compilerHandler?: CompilerHandler
  private selection?: vscode.Range
  private selectedType?: BaseType

  constructor(
    private workspaceRoot: string,
    private activeFilePath: string | undefined,
    private tsconfigPath: string,
    private options: TypeExpandProviderOptions
  ) {
    this.start()
  }

  initilizeCompilerHandler(): CompilerHandler {
    const compilerHandler = new CompilerHandler(this.tsconfigAbsolutePath())
    compilerHandler.startWatch()
    ExpandableTypeItem.initialize(compilerHandler, this.options)

    return compilerHandler
  }

  public updateConfig(
    workspaceRoot: string,
    activeFilePath: string | undefined,
    tsconfigPath: string,
    options: TypeExpandProviderOptions
  ): void {
    this.workspaceRoot = workspaceRoot
    this.activeFilePath = activeFilePath
    this.tsconfigPath = tsconfigPath
    this.options = options
  }

  private start(): void {
    if (!fs.existsSync(this.tsconfigAbsolutePath())) {
      vscode.window.showErrorMessage(
        "tsconfig.json doesn't exist.\n" +
          "Please make sure that tsconfig.json is placed under the workspace or ts-type-expand.tsconfigPath is set correctly."
      )
      return
    }
    this.compilerHandler = this.initilizeCompilerHandler()
  }

  public restart(): void {
    this.close()
    this.start()
    this.refresh()
  }

  tsconfigAbsolutePath(): string {
    return (
      this.tsconfigPath ?? path.resolve(this.workspaceRoot, "tsconfig.json")
    )
  }

  getTreeItem(element: ExpandableTypeItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: ExpandableTypeItem): Thenable<ExpandableTypeItem[]> {
    if (!this.workspaceRoot) {
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
    if (typeof this.compilerHandler === "undefined") {
      return
    }

    if (this.activeFilePath && this.selection !== selection) {
      this.selection = selection

      this.selectedType = this.compilerHandler.getTypeFromLineAndCharacter(
        this.activeFilePath,
        this.selection?.start.line,
        this.selection?.start.character
      )

      if (this.selectedType) {
        this.refresh()
      }
    }
  }

  public updateActiveFile(activeFilePath: string | undefined): void {
    this.activeFilePath = activeFilePath
    this.resetSelection()
    this.refresh()
  }

  public updateWorkspaceRoot(workspaceRoot: string): void {
    this.workspaceRoot = workspaceRoot
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
    this.compilerHandler?.closeWatch()
  }
}

type Kind = "Union" | "Properties" | "Function" | "Array" | undefined

function getKindText(type: Type): Kind {
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
      ExpandableTypeItem.compilerHandler.getTypeOfProperties(type.typeForProps)
        .length !== 0) ||
    "functionName" in type ||
    "arrayName" in type
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
  public static compilerHandler: CompilerHandler
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

  static initialize(
    compilerHandler: CompilerHandler,
    options: TypeExpandProviderOptions
  ) {
    ExpandableTypeItem.compilerHandler = compilerHandler
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
      ? ExpandableTypeItem.compilerHandler.getTypeOfProperties(
          this.type.typeForProps
        )
      : []
  }

  getUnionTypes(): BaseType[] {
    return this.type.union
  }

  isUnion(): boolean {
    return this.type.union.length !== 0
  }
}

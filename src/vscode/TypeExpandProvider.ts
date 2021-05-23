import * as vscode from "vscode"
import * as path from "path"

import type { BaseType, FunctionType, PropType } from "~/types/typescript"
import { CompilerHandler } from "~/CompilerHandler"

export class TypeExpandProvider
  implements vscode.TreeDataProvider<ExpandableTypeItem> {
  private compilerHandler: CompilerHandler
  private selection?: vscode.Range
  private selectedType?: BaseType

  constructor(
    private workspaceRoot: string,
    private activeFilePath: string | undefined,
    tsconfigPath?: string
  ) {
    this.compilerHandler = new CompilerHandler(
      tsconfigPath ?? path.resolve(workspaceRoot, "tsconfig.json")
    )
    this.compilerHandler.startWatch()
    ExpandableTypeItem.initialize(this.compilerHandler)
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
    this.compilerHandler.closeWatch()
  }
}

type OurType = BaseType | PropType | FunctionType
type Kind = "Union" | "Properties" | "Function" | "Arg" | "Return" | undefined

function getKindText(type: OurType): Kind {
  if ("functionName" in type) {
    return "Function"
  }

  if (type.union.length !== 0) {
    return "Union"
  }

  if (type.props.length !== 0 || typeof type.typeForProps !== "undefined") {
    return "Properties"
  }

  return undefined
}

function isExpandable(type: OurType): boolean {
  return (
    type.union.length !== 0 ||
    type.props.length !== 0 ||
    typeof type.typeForProps !== "undefined" ||
    "functionName" in type
  )
}

function getLabel(type: OurType): string {
  return "propName" in type
    ? isExpandable(type)
      ? type.propName
      : `${type.propName}: ${type.typeText}`
    : isExpandable(type)
    ? type.name ?? type.typeText
    : `${type.name}: ${type.typeText}`
}

class ExpandableTypeItem extends vscode.TreeItem {
  private static compilerHandler: CompilerHandler

  constructor(private type: OurType, kind?: Kind) {
    super(
      getLabel(type),
      isExpandable(type)
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    )

    this.tooltip = this.description = kind ?? getKindText(this.type)
  }

  static initialize(compilerHandler: CompilerHandler) {
    ExpandableTypeItem.compilerHandler = compilerHandler
  }

  getChildrenItems(): ExpandableTypeItem[] {
    if ("functionName" in this.type) {
      return [
        ...this.type.args.map(
          (argType) => new ExpandableTypeItem(argType, "Arg")
        ),
        new ExpandableTypeItem(this.type.returnType, "Return"),
      ]
    }

    return this.isUnion()
      ? this.getUnionTypes().map(
          (unionType) => new ExpandableTypeItem(unionType)
        )
      : this.getPropTypes().map((propType) => new ExpandableTypeItem(propType))
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

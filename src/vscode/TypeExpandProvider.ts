import * as vscode from "vscode"
import * as path from "path"

import type { BaseType, PropType } from "~/types/typescript"
import { CompilerHandler } from "~/CompilerHandler"

export class TypeExpandProvider
  implements vscode.TreeDataProvider<ExpandableTypeItem> {
  private compilerHandler: CompilerHandler
  private selection?: vscode.Range
  private selectedType?: BaseType

  constructor(
    private workspaceRoot: string,
    private activeFilePath: string | undefined
  ) {
    this.compilerHandler = new CompilerHandler(
      path.resolve(workspaceRoot, "tsconfig.json"),
      workspaceRoot
    )
    this.compilerHandler.startWatch()
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

class ExpandableTypeItem extends vscode.TreeItem {
  constructor(private type: BaseType | PropType) {
    super(
      "propName" in type ? `${type.propName}: ${type.typeText}` : type.typeText,
      type.props.length === 0 && type.union.length === 0
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed
    )

    this.tooltip = this.isUnion() ? "Union Type" : "Properties"
  }

  getChildrenItems(): ExpandableTypeItem[] {
    return this.isUnion()
      ? this.getUnionTypes().map(
          (unionType) => new ExpandableTypeItem(unionType)
        )
      : this.getPropTypes().map((propType) => new ExpandableTypeItem(propType))
  }

  getPropTypes(): PropType[] {
    return this.type.props
  }

  getUnionTypes(): BaseType[] {
    return this.type.union
  }

  isUnion(): boolean {
    return this.type.union.length !== 0
  }
}

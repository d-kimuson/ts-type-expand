import { deserializeTypeObject } from "compiler-api-helper/src/serialize"
import vscode from "vscode"
import type { TypeObject } from "compiler-api-helper"
import { client, updatePortNumber } from "~/api-client"
import type { ExtensionOption } from "~/types/option"
import { getCurrentFileLanguageId } from "~/utils/vscode"

export type TypeExpandProviderOptions = ExtensionOption

export class TypeExpandProvider
  implements vscode.TreeDataProvider<ExpandableTypeItem>
{
  private selection?: vscode.Range
  private selectedType?: {
    declareName?: string
    type: TypeObject
  }
  private activeFilePath: string | undefined

  public constructor(private options: TypeExpandProviderOptions) {
    this.updateOptions(options)
  }

  public updateOptions(options: TypeExpandProviderOptions): void {
    ExpandableTypeItem.updateOptions(options)
    if (this.options.port !== options.port) {
      updatePortNumber(options.port)
    }

    this.options = options
  }

  private isCurrentFileValidated(): boolean {
    const languageId = getCurrentFileLanguageId()
    if (languageId === undefined) {
      return false
    }

    return this.options.validate.includes(languageId)
  }

  public restart(): void {
    this.refresh()
  }

  public getTreeItem(element: ExpandableTypeItem): vscode.TreeItem {
    return element
  }

  public getChildren(
    element?: ExpandableTypeItem
  ): Thenable<ExpandableTypeItem[]> {
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

  public async updateSelection(selection: vscode.Selection): Promise<void> {
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

    const result = await client().getTypeFromPos.query({
      filePath: this.activeFilePath,
      line: this.selection.start.line,
      character: this.selection.start.character,
    })

    this.selectedType = {
      declareName: result.declareName,
      type: deserializeTypeObject(result.type),
    }

    this.refresh()
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
  public readonly onDidChangeTreeData: vscode.Event<
    ExpandableTypeItem | undefined | null | void
  > = this._onDidChangeTreeData.event

  public refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  public close(): void {
    //
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
    ? typeText.slice(0, ExpandableTypeItem.options.compactPropertyLength) +
        "..."
    : typeText
}

function getCompatLabelText(type: TypeObject): string {
  const labelText = getLabelText(type)

  return labelText.length > ExpandableTypeItem.options.compactPropertyLength
    ? labelText.slice(0, ExpandableTypeItem.options.compactPropertyLength) +
        "..."
    : labelText
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
    return type.typeText ?? "unsupported"
  }

  if (type.__type === "CallableTO") {
    return `(${type.argTypes
      .map(({ name, type }) => `${name}: ${toTypeText(type)}`)
      .join(", ")}) => ${toTypeText(type.returnType)}`
  }

  if (type.__type === "PromiseTO") {
    return `Promise<${toTypeText(type.child)}>`
  }

  if (type.__type === "PromiseLikeTO") {
    return `PromiseLike<${toTypeText(type.child)}>`
  }

  if (type.__type === "PrimitiveTO") {
    return type.kind
  }

  if (type.__type === "LiteralTO") {
    return String(type.value)
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (type.__type === "SpecialTO") {
    return type.kind
  }

  throw new Error("unreachable here")
}

export class ExpandableTypeItem extends vscode.TreeItem {
  public static options: TypeExpandProviderOptions

  public constructor(
    private type: TypeObject,
    meta?: {
      parent?: TypeObject
      aliasName?: string
      desc?: string
    }
  ) {
    super(
      typeof meta?.aliasName !== "undefined"
        ? isExpandable(type)
          ? meta.aliasName
          : `${meta.aliasName}: ${getLabelText(type)}`
        : getCompatLabelText(type),
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
    this.tooltip = toTypeText(type)
  }

  public static updateOptions(options: TypeExpandProviderOptions): void {
    ExpandableTypeItem.options = options
  }

  public async getChildrenItems(): Promise<ExpandableTypeItem[]> {
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
      return (this.type.unions as TypeObject[]).map(
        (type) => new ExpandableTypeItem(type, { parent: type })
      )
    }

    if (this.type.__type === "ObjectTO") {
      const props = await client().getObjectProps.query({
        storeKey: this.type.storeKey,
      })

      return props.map(
        ({ propName, type }) =>
          new ExpandableTypeItem(deserializeTypeObject(type), {
            aliasName: propName,
            parent: this.type,
          })
      )
    }

    if (this.type.__type === "PromiseTO") {
      const childItem = new ExpandableTypeItem(this.type.child)
      return [childItem]
    }

    return []
  }
}

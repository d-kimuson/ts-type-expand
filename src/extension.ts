import vscode from "vscode"

import {
  getCurrentFilePath,
  getActiveWorkspace,
  getConfig,
} from "~/utils/vscode"
import { TypeExpandProvider } from "~/vsc/TypeExpandProvider"

let typeExpandProvider: TypeExpandProvider

export function activate(context: vscode.ExtensionContext): void {
  const workspace = getActiveWorkspace()
  if (!workspace) {
    vscode.window.showErrorMessage("Workspace is not activated")
    return
  }

  try {
    typeExpandProvider = new TypeExpandProvider({
      compactOptionalType: getConfig<boolean>("compactOptionalType"),
      compactPropertyLength: getConfig<number>("compactPropertyLength"),
      directExpandArray: getConfig<boolean>("directExpandArray"),
    })
    typeExpandProvider.updateActiveFile(getCurrentFilePath())

    const disposes = [
      vscode.commands.registerCommand("ts-type-expand.restart", () => {
        typeExpandProvider.updateOptions({
          compactOptionalType: getConfig<boolean>("compactOptionalType"),
          compactPropertyLength: getConfig<number>("compactPropertyLength"),
          directExpandArray: getConfig<boolean>("directExpandArray"),
        })
        typeExpandProvider.updateActiveFile(getCurrentFilePath())
        typeExpandProvider.restart()

        if (typeExpandProvider.isActive()) {
          vscode.window.showInformationMessage(
            "ts-type-expand is successfully activated!"
          )
        }
      }),
      vscode.window.registerTreeDataProvider("typeExpand", typeExpandProvider),
      vscode.window.createTreeView("typeExpand", {
        treeDataProvider: typeExpandProvider,
      }),
      vscode.window.onDidChangeTextEditorSelection((e) => {
        typeExpandProvider.updateSelection(e.textEditor.selection)
      }),
      vscode.window.onDidChangeActiveTextEditor(() => {
        typeExpandProvider.updateActiveFile(getCurrentFilePath())
      }),
    ]

    disposes.forEach((dispose) => {
      context.subscriptions.push(dispose)
    })

    if (typeExpandProvider.isActive()) {
      vscode.window.showInformationMessage(
        "ts-type-expand is successfully activated!"
      )
    }
  } catch (error) {
    const typedError = error as Error
    vscode.window.showErrorMessage(typedError.message)
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void {
  typeExpandProvider.close()
  console.log("ts-type-expand is deactivated")
}

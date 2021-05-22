import * as vscode from "vscode"

import { TypeExpandProvider } from "~/vscode/TypeExpandProvider"

function getCurrentFilePath(): string | undefined {
  return vscode.window.activeTextEditor?.document.uri.fsPath
}

function getActiveWorkspace(): vscode.WorkspaceFolder | undefined {
  const currentFilePath = getCurrentFilePath()
  return (vscode.workspace.workspaceFolders || []).find((workspaceFolder) =>
    currentFilePath?.startsWith(workspaceFolder.uri.fsPath)
  )
}

export function activate(context: vscode.ExtensionContext): void {
  const workspace = getActiveWorkspace()
  if (!workspace) {
    vscode.window.showErrorMessage("Workspace is not activated")
    return
  }

  try {
    const typeExpandProvider = new TypeExpandProvider(
      workspace.uri.fsPath,
      getCurrentFilePath()
    )

    const disposes = [
      vscode.commands.registerCommand("ts-type-expand.refresh", () => {
        typeExpandProvider.refresh()
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
      // TODO: Support change workspace
    ]

    disposes.forEach((dispose) => {
      context.subscriptions.push(dispose)
    })

    console.log("ts-type-expand is now active!")
  } catch (error) {
    vscode.window.showErrorMessage(error)
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void {
  console.log("ts-type-expand is deactivated")
}

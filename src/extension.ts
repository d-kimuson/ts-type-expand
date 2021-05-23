import * as vscode from "vscode"
import * as path from "path"

import { TypeExpandProvider } from "~/vscode/TypeExpandProvider"

function getCurrentFilePath(): string | undefined {
  return vscode.window.activeTextEditor?.document.uri.fsPath
}

function getActiveWorkspace(): vscode.WorkspaceFolder | undefined {
  const workspaces = vscode.workspace.workspaceFolders || []

  return workspaces.length === 1
    ? workspaces[0]
    : workspaces.find((workspaceFolder) =>
        getCurrentFilePath()?.startsWith(workspaceFolder.uri.fsPath)
      )
}

// TODO: refactor
function getConfig<T>(key: string): T {
  const jsonConfig = vscode.workspace
    .getConfiguration("ts-type-expand")
    .get<string>(key) as string

  try {
    return JSON.parse(jsonConfig) as T
  } catch {
    return (jsonConfig as unknown) as T
  }
}

function getTsconfigPath(): string {
  const tsconfigPath = getConfig<string>("tsconfigPath")
  const workspace = getActiveWorkspace()
  return !tsconfigPath.startsWith("/") && workspace
    ? path.resolve(workspace.uri.fsPath, tsconfigPath)
    : tsconfigPath
}

let typeExpandProvider: TypeExpandProvider

export function activate(context: vscode.ExtensionContext): void {
  const workspace = getActiveWorkspace()
  if (!workspace) {
    vscode.window.showErrorMessage("Workspace is not activated")
    return
  }

  try {
    typeExpandProvider = new TypeExpandProvider(
      workspace.uri.fsPath,
      getCurrentFilePath(),
      getTsconfigPath(),
      getConfig<boolean>("compactOptionalType")
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
  typeExpandProvider.close()
  console.log("ts-type-expand is deactivated")
}

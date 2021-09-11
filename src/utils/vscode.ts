import * as vscode from "vscode"
import * as path from "path"

export function getCurrentFilePath(): string | undefined {
  return vscode.window.activeTextEditor?.document.uri.fsPath
}

export function getActiveWorkspace(): vscode.WorkspaceFolder | undefined {
  const currentFileUri = vscode.window.activeTextEditor?.document.uri

  return currentFileUri
    ? vscode.workspace.getWorkspaceFolder(currentFileUri)
    : undefined
}

/**
 * @name getConfig
 * package.json で default 値が設定されている前提
 */
export function getConfig<T>(key: string): T {
  const conf = vscode.workspace.getConfiguration("ts-type-expand").get<T>(key)

  if (!conf) {
    throw new Error(`Make sure ${key} option has default value`)
  }

  return conf
}

export function getTsconfigPath(): string {
  const tsconfigPath = getConfig<string>("tsconfigPath")
  const workspace = getActiveWorkspace()
  return !tsconfigPath.startsWith("/") && workspace
    ? path.resolve(workspace.uri.fsPath, tsconfigPath)
    : tsconfigPath
}

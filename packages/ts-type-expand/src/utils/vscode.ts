import vscode from "vscode"
import { ExtensionOption } from "~/types/option"

export function getCurrentFilePath(): string | undefined {
  return vscode.window.activeTextEditor?.document.uri.fsPath
}

export function getCurrentFileLanguageId(): string | undefined {
  return vscode.window.activeTextEditor?.document.languageId
}

export function getActiveWorkspace(): vscode.WorkspaceFolder | undefined {
  const currentFileUri = vscode.window.activeTextEditor?.document.uri

  return currentFileUri
    ? vscode.workspace.getWorkspaceFolder(currentFileUri)
    : undefined
}

/**
 * @name getExtensionConfig
 * package.json で default 値が設定されている前提
 */
export function getExtensionConfig<
  Key extends keyof ExtensionOption,
  RetType = ExtensionOption[Key]
>(key: Key): RetType {
  const conf = vscode.workspace
    .getConfiguration("ts-type-expand")
    .get<RetType>(key)

  if (!conf) {
    throw new Error(`Make sure ${key} option has default value`)
  }

  return conf
}

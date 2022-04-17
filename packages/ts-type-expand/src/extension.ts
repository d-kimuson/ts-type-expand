import vscode from "vscode"
import getPorts from "get-port"

import {
  getCurrentFilePath,
  getActiveWorkspace,
  getConfig,
} from "~/utils/vscode"
import { TypeExpandProvider } from "~/vsc/TypeExpandProvider"

let typeExpandProvider: TypeExpandProvider

type TypescriptLanguageFeatures = {
  getAPI(n: number): {
    configurePlugin: <PluginName extends keyof PluginOptions>(
      pluginName: PluginName,
      options: PluginOptions[PluginName]
    ) => void
  }
}

type PluginOptions = {
  "ts-type-expand-plugin": {
    port: number
  }
}

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  console.log("called activate")
  const workspace = getActiveWorkspace()
  if (!workspace) {
    vscode.window.showErrorMessage("Workspace is not activated")
    return
  }

  try {
    const tsFeatureExtension =
      vscode.extensions.getExtension<TypescriptLanguageFeatures>(
        "vscode.typescript-language-features"
      )

    if (!tsFeatureExtension) {
      vscode.window.showErrorMessage(
        "Fail to start kimuson.ts-type-expand because vscode.typescript-language-features is not enabled."
      )
      return
    }

    await tsFeatureExtension.activate()
    const api = tsFeatureExtension.exports

    if (api.getAPI === undefined) {
      console.log("getAPI undefined")
      return
    }

    const tsApi = api.getAPI(0)
    const port = await getPorts({
      port: 3264,
    })
    tsApi.configurePlugin("ts-type-expand-plugin", {
      port,
    })

    typeExpandProvider = new TypeExpandProvider({
      compactOptionalType: getConfig<boolean>("compactOptionalType"),
      compactPropertyLength: getConfig<number>("compactPropertyLength"),
      directExpandArray: getConfig<boolean>("directExpandArray"),
      port,
    })
    typeExpandProvider.updateActiveFile(getCurrentFilePath())

    const disposes = [
      vscode.commands.registerCommand("ts-type-expand.restart", () => {
        typeExpandProvider.updateOptions({
          compactOptionalType: getConfig<boolean>("compactOptionalType"),
          compactPropertyLength: getConfig<number>("compactPropertyLength"),
          directExpandArray: getConfig<boolean>("directExpandArray"),
          port,
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

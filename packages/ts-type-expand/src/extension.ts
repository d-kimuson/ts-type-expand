import vscode from "vscode"
import getPorts from "get-port"

import { getCurrentFilePath, getExtensionConfig } from "~/utils/vscode"
import {
  TypeExpandProvider,
  TypeExpandProviderOptions,
} from "~/vsc/TypeExpandProvider"

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

const extensionClosure = () => {
  let isActivatedTsServer = false
  let prevPortNum = NaN
  let typeExpandProvider: TypeExpandProvider
  let tsApi: ReturnType<TypescriptLanguageFeatures["getAPI"]>

  // private
  const getAndUpdatePort = async (): Promise<number> => {
    const portNum = getExtensionConfig("port")
    if (!Number.isNaN(prevPortNum) && prevPortNum === portNum) {
      return portNum
    }

    const port = await getPorts({
      port: prevPortNum,
    })
    tsApi.configurePlugin("ts-type-expand-plugin", {
      port,
    })
    prevPortNum = port
    return port
  }

  const extensionConfig = async (): Promise<TypeExpandProviderOptions> => {
    return {
      compactOptionalType: getExtensionConfig("compactOptionalType"),
      compactPropertyLength: getExtensionConfig("compactPropertyLength"),
      directExpandArray: getExtensionConfig("directExpandArray"),
      port: await getAndUpdatePort(),
    }
  }

  const updateCurrentFile = async (): Promise<void> => {
    const currentFile = getCurrentFilePath()
    if (currentFile === undefined) return

    if (!(currentFile.endsWith(".ts") || currentFile.endsWith(".tsx"))) {
      // ts ファイルだが tsconfig に含まれてない？ケースだとバグる気がする？
      // js ファイルがサポートできてないのでロジック見直しが必要
      return
    }

    if (!isActivatedTsServer) {
      // timeout したほうが良さそうではあるな :thinking_face:
      await typeExpandProvider.waitUntilServerActivated()
    }

    isActivatedTsServer = true
    typeExpandProvider.updateActiveFile(currentFile)
    vscode.window.showInformationMessage("ts-type-expand is ready to use!")
  }

  // exports
  const activate = async (context: vscode.ExtensionContext): Promise<void> => {
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
        return
      }

      tsApi = api.getAPI(0)

      typeExpandProvider = new TypeExpandProvider(await extensionConfig())

      const disposes = [
        vscode.commands.registerCommand("ts-type-expand.restart", async () => {
          typeExpandProvider.updateOptions(await extensionConfig())
          await updateCurrentFile()
          typeExpandProvider.restart()

          vscode.window.showInformationMessage(
            "ts-type-expand is successfully restarted!"
          )
        }),
        vscode.window.registerTreeDataProvider(
          "typeExpand",
          typeExpandProvider
        ),
        vscode.window.createTreeView("typeExpand", {
          treeDataProvider: typeExpandProvider,
        }),
        vscode.window.onDidChangeTextEditorSelection((e) => {
          if (!isActivatedTsServer) {
            vscode.window.showWarningMessage(
              "TS server is not ready. Please wait a few seconds."
            )
            return
          }

          typeExpandProvider.updateSelection(e.textEditor.selection)
        }),
        vscode.window.onDidChangeActiveTextEditor(async () => {
          await updateCurrentFile()
        }),
      ]

      disposes.forEach((dispose) => {
        context.subscriptions.push(dispose)
      })

      await updateCurrentFile()
    } catch (error) {
      const typedError = error as Error
      vscode.window.showErrorMessage(typedError.message)
    }
  }

  const deactivate = () => {
    typeExpandProvider.close()
    console.log("ts-type-expand is deactivated")
  }

  return { activate, deactivate }
}

export const { activate, deactivate } = extensionClosure()

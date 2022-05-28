import vscode from "vscode"
import getPorts from "get-port"

import {
  getCurrentFileLanguageId,
  getCurrentFilePath,
  getExtensionConfig,
} from "~/utils/vscode"
import {
  TypeExpandProvider,
  TypeExpandProviderOptions,
} from "~/vsc/TypeExpandProvider"
import { ApiClient } from "./api-client"

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

type ServerStatus = "unloaded" | "loading" | "active" | "failed" | "dead"

const extensionClosure = () => {
  let serverStatus: ServerStatus = "unloaded"
  let prevPortNum = NaN
  let typeExpandProvider: TypeExpandProvider
  let tsApi: ReturnType<TypescriptLanguageFeatures["getAPI"]>
  let apiClient: ApiClient

  // private
  const getAndUpdatePort = async (): Promise<number> => {
    const portNum = getExtensionConfig("port")

    if (Number.isNaN(portNum)) {
      throw new TypeError("postNum should not be NaN.")
    }

    // サーバーが生きててポート番号が変わってないならそのまま
    if (serverStatus !== "failed" && prevPortNum === portNum) {
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
      validate: getExtensionConfig("validate"),
      port: await getAndUpdatePort(),
    }
  }

  const checkAndUpdateServerStatus = async (): Promise<boolean> => {
    const { isActivated } = await apiClient.isActivated()
    if (isActivated) {
      serverStatus = "active"
      return true
    }

    return false
  }

  const checkDeadServerAndTryRestart = async () => {
    try {
      const isActive = await checkAndUpdateServerStatus()

      if (isActive) return

      // re-configure ts-plugin
      typeExpandProvider.updateOptions(await extensionConfig())
      setTimeout(() => {
        checkAndUpdateServerStatus().then((isActive) => {
          if (!isActive) {
            serverStatus = "dead"
            vscode.window.showErrorMessage(
              "Could not connect to TS server. Try `typescript.restartTsServer`."
            )
          }
        })
      }, 500)
    } catch (err) {
      serverStatus = "dead"
      vscode.window.showErrorMessage(
        "Could not connect to TS server. Try `typescript.restartTsServer`."
      )
    }
  }

  const initializeOrRepairPlugin = async () => {
    if (serverStatus === "unloaded") {
      try {
        serverStatus = "loading"
        await typeExpandProvider.waitUntilServerActivated(15000)
      } catch (err) {
        console.error(err)
        checkDeadServerAndTryRestart()
        return
      }

      serverStatus = "active"
      vscode.window.showInformationMessage("ts-type-expand is ready to use!")
    }

    if (serverStatus === "failed") {
      checkDeadServerAndTryRestart()
    }
  }

  const updateCurrentFile = async (): Promise<void> => {
    const currentFile = getCurrentFilePath()
    const languageId = getCurrentFileLanguageId()

    if (currentFile === undefined || languageId === undefined) return

    const isValidatedExtension =
      getExtensionConfig("validate").includes(languageId)

    if (!isValidatedExtension) {
      return
    }

    initializeOrRepairPlugin()
    typeExpandProvider.updateActiveFile(currentFile)
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

      const config = await extensionConfig()
      apiClient = new ApiClient(config.port, (err) => {
        const errorRes = err.response
        if (
          serverStatus === "active" &&
          (errorRes === undefined || errorRes.status === 500)
        ) {
          console.error(
            "Unexpected Error Occurred",
            errorRes,
            500,
            serverStatus
          )

          serverStatus = "failed"
          checkDeadServerAndTryRestart()
        }
      })
      typeExpandProvider = new TypeExpandProvider(config, apiClient)

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
          const languageId = getCurrentFileLanguageId()
          if (
            languageId === undefined ||
            !getExtensionConfig("validate").includes(languageId)
          ) {
            return // skip
          }

          if (serverStatus === "unloaded" || serverStatus === "loading") {
            vscode.window.showWarningMessage(
              "TS server is not ready. Please wait a few seconds."
            )
            return
          }

          if (serverStatus !== "active") return

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

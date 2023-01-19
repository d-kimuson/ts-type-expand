import vscode, { TextEditorSelectionChangeKind } from "vscode"
import getPorts from "get-port"

import {
  getCurrentFileLanguageId,
  getCurrentFilePath,
  getExtensionConfig,
} from "~/utils/vscode"
import {
  TypeExpandProvider,
  TypeExpandProviderOptions,
} from "~/vsc/type-expand-provider"
import { client, updatePortNumber } from "./api-client"
import { logger } from "./utils/logger"

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
  let currentPortNumber = NaN
  let typeExpandProvider: TypeExpandProvider
  let tsApi: ReturnType<TypescriptLanguageFeatures["getAPI"]>

  const startPlugin = async () => {
    const defaultPort = getExtensionConfig("port")

    if (Number.isNaN(defaultPort)) {
      throw new TypeError("postNum should not be NaN.")
    }

    const portNumber = await getPorts({
      port: defaultPort,
    })

    logger.info("REQUEST_PLUGIN", {
      message: "configurePlugin",
      port: portNumber,
    })

    tsApi.configurePlugin("ts-type-expand-plugin", {
      port: portNumber,
    })
    currentPortNumber = portNumber
    updatePortNumber(currentPortNumber)

    await waitUntilServerActivated(15000)
      .then(() => {
        vscode.window.showInformationMessage("ts-type-expand is ready to use!")
      })
      .catch((error) => {
        logger.error("SERVER_START_TIMEOUT", {
          message: "timeout for starting ts-type-expand-plugin start.",
          error,
        })
        vscode.window.showErrorMessage(
          "Could not connect to TS server. Try `typescript.restartTsServer`."
        )
      })

    return portNumber
  }

  const extensionConfig = async (): Promise<TypeExpandProviderOptions> => {
    return {
      compactOptionalType: getExtensionConfig("compactOptionalType"),
      compactPropertyLength: getExtensionConfig("compactPropertyLength"),
      directExpandArray: getExtensionConfig("directExpandArray"),
      validate: getExtensionConfig("validate"),
      port: currentPortNumber,
    }
  }

  const updateServerStatus = async (): Promise<void> => {
    try {
      const { data } = await client().isServerActivated.query()
      if (data.isActivated) {
        serverStatus = "active"
      } else {
        serverStatus = "failed"
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error("FAILED_TO_FETCH_SERVER_ACTIVATED", {
          message: error.message,
          stack: error.stack,
        })
      }

      serverStatus = "failed"
    }
  }

  const waitUntilServerActivated = async (timeout?: number) =>
    new Promise((resolve, reject) => {
      serverStatus = "loading"

      const timerId = setInterval(() => {
        updateServerStatus().then(() => {
          if (serverStatus === "active") {
            clearInterval(timerId)
            resolve(undefined)
          }
        })
      }, 500)

      setTimeout(() => {
        if (serverStatus === "active") {
          return
        }

        serverStatus = "dead"
        clearInterval(timerId)
        reject("timeout")
      }, timeout ?? 10000)
    })

  const updateCurrentFile = async (): Promise<void> => {
    const currentFile = getCurrentFilePath()
    const languageId = getCurrentFileLanguageId()

    if (currentFile === undefined || languageId === undefined) return

    const isValidatedExtension =
      getExtensionConfig("validate").includes(languageId)

    if (!isValidatedExtension) {
      return
    }

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

      const config = await extensionConfig()
      typeExpandProvider = new TypeExpandProvider(config)

      await tsFeatureExtension.activate()
      const api = tsFeatureExtension.exports

      if (api.getAPI === undefined) {
        return
      }

      tsApi = api.getAPI(0)
      await startPlugin()
      await updateCurrentFile()

      const disposes = [
        vscode.commands.registerCommand("ts-type-expand.restart", async () => {
          typeExpandProvider.updateOptions(await extensionConfig())
          await startPlugin()
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
        vscode.window.onDidChangeTextEditorSelection(async (e) => {
          /**
           * If move it even with keystrokes, it delays and break the LSP.
           */
          if (e.kind !== TextEditorSelectionChangeKind.Mouse) {
            return // skip
          }

          const languageId = getCurrentFileLanguageId()
          if (
            languageId === undefined ||
            !getExtensionConfig("validate").includes(languageId)
          ) {
            return // skip
          }

          if (serverStatus === "loading") {
            vscode.window.showWarningMessage(
              "TS server is not ready. Please wait a few seconds."
            )
            return
          }

          if (serverStatus !== "active") return

          try {
            await typeExpandProvider.updateSelection(e.textEditor.selection)
          } catch (error) {
            if (error instanceof Error) {
              logger.error("UPDATE_SELECTION_ERROR", {
                message: error.message,
                stack: error.stack,
              })
            }
          }
        }),
        vscode.window.onDidChangeActiveTextEditor(async () => {
          await updateCurrentFile()
        }),
      ]

      disposes.forEach((dispose) => {
        context.subscriptions.push(dispose)
      })
    } catch (error) {
      if (error instanceof Error) {
        vscode.window.showErrorMessage(error.message)
        logger.error("ACTIVATION_ERROR", {
          message: error.message,
          stack: error.stack,
        })
      } else {
        logger.error("UNEXPECTED_ERROR", {
          error,
        })
      }
    }
  }

  const deactivate = () => {
    logger.info("DEACTIVATE_EXTENSION", {})
    typeExpandProvider.close()
  }

  return { activate, deactivate }
}

export const { activate, deactivate } = extensionClosure()

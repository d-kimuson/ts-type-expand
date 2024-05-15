import { mkdirSync } from 'fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { TRPCClientError } from '@trpc/client'
import vscode, { TextEditorSelectionChangeKind } from 'vscode'
import type { TreeView } from 'vscode'
import {
  getCurrentFileLanguageId,
  getCurrentFilePath,
  getExtensionConfig,
} from '~/utils/vscode'
import type {
  ExpandableTypeItem,
  TypeExpandProviderOptions,
} from '~/vsc/type-expand-provider'
import { TypeExpandProvider } from '~/vsc/type-expand-provider'
import { client, updatePortNumber } from './api-client'
import { logger } from './utils/logger'
import { tsTypeExpandConfig } from './config'

type GetAPI = (n: number) => {
  configurePlugin: <PluginName extends keyof PluginOptions>(
    pluginName: PluginName,
    options: PluginOptions[PluginName],
  ) => void
}

type TypescriptLanguageFeatures = {
  getAPI?: GetAPI
}

type PluginOptions = {
  'ts-type-expand-plugin': {
    port: number
  }
}

type ServerStatus = 'unloaded' | 'loading' | 'active' | 'failed' | 'dead'

export type State = {
  serverStatus: ServerStatus
  port: number
}

type ProxyHandler<T extends Record<string, unknown>> = {
  get: (target: T, prop: keyof T) => T[keyof T]
  set: (target: T, prop: keyof T, value: T[keyof T]) => boolean
}

const treeViewTitle = (value: ServerStatus) =>
  `${tsTypeExpandConfig.extensionId} (${value})`

const extensionClosure = () => {
  let typeExpandProvider: TypeExpandProvider
  let treeView: TreeView<ExpandableTypeItem>
  let tsApi: ReturnType<GetAPI>

  const state = new Proxy(
    {
      serverStatus: 'unloaded',
      port: NaN,
    } satisfies State,
    {
      get: (target, prop) => target[prop],
      set: (target, prop, value): boolean => {
        const previous = target[prop]
        if (previous === value) true

        // @ts-expect-error -- Proxy, so the type of target[prop] actually matches value
        target[prop] = value

        // hook
        switch (prop) {
          case 'serverStatus':
            treeView.title = treeViewTitle(value as ServerStatus)

            if (value === 'active') {
              vscode.window.showInformationMessage(
                `${tsTypeExpandConfig.extensionId} is ready to use!`,
              )
            } else if (value === 'dead') {
              vscode.window.showErrorMessage(
                'Could not connect to TS server. Try `typescript.restartTsServer`.',
              )
            } else if (value === 'failed') {
              startPlugin().catch((error) => {
                throw error
              })
            }
            break
          case 'port':
            break
          default:
            prop satisfies never
        }

        return true
      },
    } satisfies ProxyHandler<State>,
  )

  const startPlugin = async () => {
    const defaultPort = getExtensionConfig('port')

    if (Number.isNaN(defaultPort)) {
      throw new TypeError('postNum should not be NaN.')
    }

    const getPorts = await import('get-port').then((mod) => mod.default)
    const portNumber = await getPorts({
      port: defaultPort,
    })

    logger.info('REQUEST_PLUGIN', {
      message: 'configurePlugin',
      port: portNumber,
    })

    tsApi.configurePlugin('ts-type-expand-plugin', {
      port: portNumber,
    })
    state.port = portNumber
    updatePortNumber(state.port)

    await waitUntilServerActivated(20000).catch((error) => {
      logger.error('SERVER_START_TIMEOUT', {
        message: 'timeout for starting ts-type-expand-plugin start.',
        error,
      })
    })

    return portNumber
  }

  const extensionConfig = async (): Promise<TypeExpandProviderOptions> => {
    return {
      compactOptionalType: getExtensionConfig('compactOptionalType'),
      compactPropertyLength: getExtensionConfig('compactPropertyLength'),
      directExpandArray: getExtensionConfig('directExpandArray'),
      validate: getExtensionConfig('validate'),
      port: state.port,
    }
  }

  const updateServerStatus = async (): Promise<void> => {
    try {
      const { data } = await client().isServerActivated.query()
      if (data.isActivated) {
        state.serverStatus = 'active'
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error('FAILED_TO_FETCH_SERVER_ACTIVATED', {
          message: error.message,
          stack: error.stack,
        })
      }
    }
  }

  const waitUntilServerActivated = async (timeout?: number) =>
    new Promise((resolve, reject) => {
      state.serverStatus = 'loading'

      const timerId = setInterval(() => {
        updateServerStatus().then(() => {
          if (state.serverStatus === 'active') {
            clearInterval(timerId)
            resolve(undefined)
          }
        })
      }, 500)

      setTimeout(() => {
        if (state.serverStatus === 'active') {
          return
        }

        state.serverStatus = 'dead'
        clearInterval(timerId)
        reject('timeout')
      }, timeout ?? 10000)
    })

  const updateCurrentFile = async (): Promise<void> => {
    const currentFile = getCurrentFilePath()
    const languageId = getCurrentFileLanguageId()

    if (currentFile === undefined || languageId === undefined) return

    const isValidatedExtension =
      getExtensionConfig('validate').includes(languageId)

    if (!isValidatedExtension) {
      return
    }

    typeExpandProvider.updateActiveFile(currentFile)
  }

  const initializeExtension = async () => {
    await startPlugin()
    await updateCurrentFile()
  }

  // exports
  const activate = async (context: vscode.ExtensionContext): Promise<void> => {
    try {
      const HOME_DIR = homedir()
      mkdirSync(resolve(HOME_DIR, '.ts-type-expand', 'logs', 'plugin'), {
        recursive: true,
      })
      mkdirSync(resolve(HOME_DIR, '.ts-type-expand', 'logs', 'extension'), {
        recursive: true,
      })

      const config = await extensionConfig()

      typeExpandProvider = new TypeExpandProvider(config)
      treeView = vscode.window.createTreeView(tsTypeExpandConfig.extensionId, {
        treeDataProvider: typeExpandProvider,
      })
      treeView.title = treeViewTitle(state.serverStatus)

      const tsFeatureExtension =
        vscode.extensions.getExtension<TypescriptLanguageFeatures>(
          'vscode.typescript-language-features',
        )

      if (!tsFeatureExtension) {
        vscode.window.showErrorMessage(
          `Fail to start kimuson.${tsTypeExpandConfig.extensionId} because vscode.typescript-language-features is not enabled.`,
        )
        return
      }

      await tsFeatureExtension.activate()
      const api = tsFeatureExtension.exports

      if (api.getAPI === undefined) {
        return
      }

      tsApi = api.getAPI(0)

      const languageId = getCurrentFileLanguageId()
      if (languageId !== undefined && config.validate.includes(languageId)) {
        await initializeExtension()
      }

      const disposes = [
        vscode.commands.registerCommand(
          tsTypeExpandConfig.command('restart'),
          async () => {
            typeExpandProvider.updateOptions(await extensionConfig())
            await startPlugin()
            await updateCurrentFile()
            typeExpandProvider.restart()
          },
        ),
        vscode.commands.registerCommand(
          tsTypeExpandConfig.command('copy'),
          async (value: ExpandableTypeItem) => {
            vscode.env.clipboard.writeText(await value.getCopyText())
          },
        ),
        vscode.window.registerTreeDataProvider(
          tsTypeExpandConfig.extensionId,
          typeExpandProvider,
        ),
        treeView,
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
            !getExtensionConfig('validate').includes(languageId)
          ) {
            return // skip
          }

          if (state.serverStatus === 'loading') {
            vscode.window.showWarningMessage(
              'TS server is not ready. Please wait a few seconds.',
            )
            return
          }

          if (state.serverStatus !== 'active') return

          try {
            await typeExpandProvider.updateSelection(e.textEditor.selection)
          } catch (error) {
            if (error instanceof TRPCClientError) {
              logger.error('TRPC_SERVER_ERROR', {
                error,
              })
              return
            }

            state.serverStatus = 'failed'

            if (error instanceof Error) {
              logger.error('UPDATE_SELECTION_ERROR', {
                message: error.message,
                stack: error.stack,
              })

              vscode.window.showErrorMessage(error.message)
              return
            }

            logger.error('UPDATE_SELECTION_ERROR', {
              error,
            })
            vscode.window.showErrorMessage(String(error))
          }
        }),
        vscode.window.onDidChangeActiveTextEditor(async () => {
          if (state.serverStatus === 'unloaded') {
            const languageId = getCurrentFileLanguageId()
            if (
              languageId !== undefined &&
              config.validate.includes(languageId)
            ) {
              await initializeExtension()
            }
          }

          if (state.serverStatus !== 'active') return

          await updateCurrentFile()
        }),
      ]

      disposes.forEach((dispose) => {
        context.subscriptions.push(dispose)
      })
    } catch (error) {
      if (error instanceof Error) {
        vscode.window.showErrorMessage(error.message)
        logger.error('ACTIVATION_ERROR', {
          message: error.message,
          stack: error.stack,
        })
      } else {
        logger.error('UNEXPECTED_ERROR', {
          error,
        })
      }
    }
  }

  const deactivate = () => {
    logger.info('DEACTIVATE_EXTENSION', {})
    typeExpandProvider.close()
  }

  return { activate, deactivate }
}

export const { activate, deactivate } = extensionClosure()

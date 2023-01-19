import { LanguageServiceMode, server } from "typescript/lib/tsserverlibrary"
import type { Server } from "http"
import express from "express"
import { PluginConfiguration, pluginConfigurationSchema } from "./schema"
import { registerApp } from "./server/app"
import { logger } from "./logger"
import { setCreateInfo } from "./server/context"

const factory: server.PluginModuleFactory = (mod) => {
  let server: Server | undefined
  let start: ((port: number) => void) | undefined
  let isInitialized: boolean = false

  return {
    create(info) {
      logger.info("CALLED_CREATE_INFO", {
        serverMode: info.project.projectService.serverMode,
        config: info.config,
      })

      setCreateInfo(info)

      if (isInitialized) {
        return info.languageService
      }

      const app = express()
      registerApp(app)

      start = (port) => {
        logger.info(`START_TS_EXPAND_PLUGIN`, {
          port: port,
        })

        server?.close()
        server = app.listen(port)
      }

      isInitialized = true

      return info.languageService
    },
    onConfigurationChanged(config: PluginConfiguration) {
      const parsed = pluginConfigurationSchema.safeParse(config)
      if (!parsed.success) {
        logger.error("INVALID_PLUGIN_CONFIGURATION", {
          data: config,
          error: parsed.error.issues,
        })
        return
      }

      logger.info("ON_UPDATE_CONF", config)
      if (start === undefined) {
        logger.error("BEFORE_INITIALIZE", {})
        return
      }

      start(config.port)
    },
  }
}

export = factory

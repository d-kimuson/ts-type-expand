import type * as ts from "typescript/lib/tsserverlibrary"
import "open-typescript"

import express from "express"
import * as http from "http"
import type { PluginConfiguration } from "./types"
import { registerApp } from "./server/app"

const factory: ts.server.PluginModuleFactory = (mod) => {
  let server: http.Server | undefined
  let start: ((port: number) => void) | undefined

  return {
    create(info) {
      /*
       * TODO: info.languageService.getProgram() をファイルが変更されるたびに更新する必要があるはず
       * だけどやってないので、あとからやる
       *
       * getProgram がメソッドになってるってことは info を保持しておいて毎回叩く or onType で updateProgram するエンドポイントを叩く
       */

      if (info.project.projectService.serverMode !== 0) {
        return info.languageService
      }

      const config = info.config as Partial<PluginConfiguration> | undefined

      start = (port) => {
        server?.close()
        server = app.listen(port, () => {
          console.log(`Start Ts Type Expand Plugin listening on port ${port}`)
        })
      }

      const app = express()
      app.use(express.json())
      registerApp(app, info).then(() => {
        if (start && config?.port) {
          start(config.port)
        }
      })

      return {
        ...info.languageService,
      }
    },
    onConfigurationChanged(config: Partial<PluginConfiguration>) {
      if (config.port && start) {
        start(config.port)
      }
    },
  }
}

export = factory

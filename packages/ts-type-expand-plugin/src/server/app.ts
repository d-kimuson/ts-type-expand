import express, { Express } from "express"
import { CompilerHandler } from "../service/compiler-api-handler"
import { TypeObject } from "compiler-api-helper"
import type * as ts from "typescript"
import type * as tsServer from "typescript/lib/tsserverlibrary"

type FetchTypeFromPosReq = {
  filePath: string
  line: number
  character: number
}

type FetchTypeFromPosRes = {
  declareName?: string
  type: TypeObject
}

export const registerApp = (() => {
  let compilerHandler: CompilerHandler | undefined

  return async (
    app: Express,
    info: tsServer.server.PluginCreateInfo
  ): Promise<void> => {
    app.use((_req, _res, next) => {
      if (compilerHandler === undefined) {
        const program = info.languageService.getProgram()
        if (program) {
          compilerHandler = new CompilerHandler(program as ts.Program)
        }
      }
      next()
    })

    app.post<
      {},
      FetchTypeFromPosRes | { message: string },
      FetchTypeFromPosReq
    >("/get_type_from_pos", (req, res) => {
      try {
        const { filePath, line, character } = req.body
        const maybeType = compilerHandler?.getTypeFromLineAndCharacter(
          filePath,
          line,
          character
        )

        if (!maybeType) {
          res.status(500).send({ message: "maybeType is not defined" })
          return
        }

        const [declareName, typeObject] = maybeType

        res.send({
          declareName,
          // TODO: typeObject がオブジェクトとかだとうまくパースできないので要対応
          type: typeObject,
        })
      } catch (err) {
        console.log("error occured", err)
        res.status(500).send({ message: `error: ${(err as Error).toString()}` })
      }
    })
  }
})()

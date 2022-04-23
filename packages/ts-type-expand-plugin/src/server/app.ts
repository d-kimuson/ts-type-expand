import { Express } from "express"
import { CompilerHandler } from "../service/compiler-api-handler"
import type { TypeObject } from "compiler-api-helper"
import type { Program } from "typescript"
import type { server } from "typescript/lib/tsserverlibrary"
import { decycle } from "json-cyclic"

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
  let info: server.PluginCreateInfo
  let compilerHandler: CompilerHandler | undefined

  return async (
    app: Express,
    _info: server.PluginCreateInfo
  ): Promise<void> => {
    info = _info

    app.use((_req, _res, next) => {
      const program = info.languageService.getProgram() as Program
      if (program === undefined) {
        _res.send(500).send({ message: "Program not found." })
        return
      }

      if (compilerHandler === undefined) {
        compilerHandler = new CompilerHandler(program)
      } else {
        compilerHandler.updateProgram(program)
      }

      next()
    })

    app.get<{}, { isActivated: boolean }, {}>("/is_activated", (req, res) => {
      res.send({
        isActivated: true,
      })
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
          type: decycle(typeObject),
        })
      } catch (err) {
        if (err instanceof Error) {
          res.status(500).send({
            message: `error: ${err.toString()}`,
          })
        }

        res.status(500).send({ message: "Unexpected Error" })
      }
    })
  }
})()

import { Express } from "express"
import { CompilerHandler } from "../service/compiler-api-handler"
import type { TypeObject } from "compiler-api-helper"
import type { Program } from "typescript"
import type { server } from "typescript/lib/tsserverlibrary"

type FetchTypeFromPosReq = {
  filePath: string
  line: number
  character: number
}

type FetchTypeFromPosRes = {
  declareName?: string
  type: TypeObject
}

type GetObjectPropsReq = {
  storeKey: string
}

type GetObjectPropsRes = {
  props: { propName: string; type: TypeObject }[]
}

export const registerApp = (() => {
  let info: server.PluginCreateInfo
  let compilerHandler: CompilerHandler | undefined

  return async (
    app: Express,
    _info: server.PluginCreateInfo
  ): Promise<void> => {
    info = _info

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
      const program = info.languageService.getProgram() as Program
      if (program === undefined) {
        res.status(500).send({ message: "Program not found." })
        return
      }

      if (compilerHandler === undefined) {
        compilerHandler = new CompilerHandler(program)
      } else {
        compilerHandler.updateProgram(program)
      }

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
          type: typeObject,
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

    app.post<{}, GetObjectPropsRes | { message: string }, GetObjectPropsReq>(
      "/get_object_props",
      (req, res) => {
        try {
          const { storeKey } = req.body
          if (compilerHandler === undefined) {
            res.send({
              props: [
                {
                  propName: "debug1",
                  type: {
                    __type: "UnsupportedTO",
                    kind: "enumValNotFound", // 適当
                  },
                },
              ],
            })
            return
          }
          const props = compilerHandler.getObjectProps(storeKey)

          res.send({
            props: props,
          })
        } catch (err) {
          if (err instanceof Error) {
            res.status(500).send({
              message: `error: ${err.toString()}`,
            })
          }

          res.status(500).send({ message: "Unexpected Error" })
        }
      }
    )
  }
})()

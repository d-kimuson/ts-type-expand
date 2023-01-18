import { Express } from "express"
import { CompilerHandler } from "../service/compiler-api-handler"
import type { server } from "typescript/lib/tsserverlibrary"
import type {
  CommonRes,
  FetchTypeFromPosReq,
  FetchTypeFromPosRes,
  GetObjectPropsReq,
  GetObjectPropsRes,
  IsActivatedRes,
} from "shared"
import { logger } from "../logger"

export const registerApp = (() => {
  let info: server.PluginCreateInfo
  let compilerHandler: CompilerHandler | undefined

  return async (
    app: Express,
    _info: server.PluginCreateInfo
  ): Promise<void> => {
    info = _info

    app.use((req, res, next) => {
      logger.info("START_REQUEST", {
        path: req.url,
        method: req.method,
        params: req.params,
        body: req.body,
      })
      next()
    })

    app.get<{}, CommonRes<IsActivatedRes>, {}>("/is_activated", (req, res) => {
      logger.info("START_REQUEST", {
        path: req.url,
        method: req.method,
        params: req.params,
        body: req.body,
      })

      res.send({
        success: true,
        data: {
          isActivated: true,
        },
      })
    })

    app.post<{}, CommonRes<FetchTypeFromPosRes>, FetchTypeFromPosReq>(
      "/get_type_from_pos",
      (req, res) => {
        const program = info.languageService.getProgram()
        if (program === undefined) {
          res.send({ success: false, message: "Program not found." })
          return
        }

        if (compilerHandler === undefined) {
          compilerHandler = new CompilerHandler(program)
        } else {
          compilerHandler.updateProgram(program)
        }

        try {
          const { filePath, line, character } = req.body
          const maybeType = compilerHandler.getTypeFromLineAndCharacter(
            filePath,
            line,
            character
          )

          if (!maybeType) {
            res.send({ success: false, message: "maybeType is not defined" })
            return
          }

          const [declareName, typeObject] = maybeType

          res.send({
            success: true,
            data: {
              declareName,
              type: typeObject,
            },
          })
        } catch (err) {
          if (err instanceof Error) {
            res.send({
              success: false,
              message: `error: ${err.toString()}`,
            })
          }

          res.send({ success: false, message: "Unexpected Error" })
        }
      }
    )

    app.post<{}, CommonRes<GetObjectPropsRes>, GetObjectPropsReq>(
      "/get_object_props",
      (req, res) => {
        try {
          const { storeKey } = req.body
          if (compilerHandler === undefined) {
            res.send({
              success: false,
              message: "compilerHandler not found",
            })
            return
          }
          const props = compilerHandler.getObjectProps(storeKey)

          res.send({
            success: true,
            data: {
              props: props,
            },
          })
        } catch (err) {
          if (err instanceof Error) {
            res.send({
              success: false,
              message: `error: ${err.toString()}`,
            })
          }

          res.send({ success: false, message: "Unexpected Error" })
        }
      }
    )
  }
})()

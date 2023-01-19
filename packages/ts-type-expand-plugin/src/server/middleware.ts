import { TRPCError } from "@trpc/server"
import { Context } from "./context"
import { t } from "./trpc"
import { Program } from "typescript"
import { CompilerHandler } from "../service/compiler-api-handler"
import { logger } from "../logger"

export type RequiredProgramContext = Omit<Context, "program"> & {
  program: Program
  compilerHandler: CompilerHandler
}

const { setCompilerHandler, getCompilerHandler } = (() => {
  let compilerHandler: CompilerHandler | undefined

  return {
    setCompilerHandler: (handler: CompilerHandler): void => {
      compilerHandler = handler
    },
    getCompilerHandler: (): CompilerHandler | undefined => compilerHandler,
  }
})()

export const requiredProgramMiddleware = t.middleware(({ ctx, next }) => {
  if (typeof ctx.program === "undefined") {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
    })
  }

  const compilerHandler = ((): CompilerHandler => {
    const previousHandler = getCompilerHandler()
    if (previousHandler !== undefined) {
      previousHandler.updateProgram(ctx.program)
      return previousHandler
    }

    return new CompilerHandler(ctx.program)
  })()

  setCompilerHandler(compilerHandler)

  return next({
    ctx: {
      ...ctx,
      program: ctx.program,
      compilerHandler,
    } satisfies RequiredProgramContext,
  })
})

export const loggingMiddleware = t.middleware(
  async ({ path, type, ctx, next }) => {
    const start = Date.now()

    logger.info("START_REQUEST", {
      path,
      type,
    })

    const result = await next()
    const durationMs = Date.now() - start

    logger.info("SERVER_RESPONSE", {
      path,
      type,
      durationMs,
      result: result.ok
        ? result.data
        : {
            error: true,
            value: result.error,
          },
    })

    return result
  }
)

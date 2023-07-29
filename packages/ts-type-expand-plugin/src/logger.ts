import { homedir } from "node:os"
import { resolve } from "node:path"
import { createLogger, format, transports } from "winston"

type LogLevel = "info" | "warn" | "error"

type ILogger = {
  [K in LogLevel]: (
    kind: string,
    obj: Record<string, unknown>,
    message?: string
  ) => void
}

const HOME_DIR = homedir()

const winstonLogger = createLogger({
  format: format.json(),
  defaultMeta: {
    context: "ts-type-expand-plugin",
  },
  transports: [
    new transports.File({
      filename: resolve(
        HOME_DIR,
        ".ts-type-expand",
        "logs",
        "plugin",
        "info.log"
      ),
      level: "info",
    }),
    new transports.File({
      filename: resolve(
        HOME_DIR,
        ".ts-type-expand",
        "logs",
        "plugin",
        "warn.log"
      ),
      level: "warn",
    }),
    new transports.File({
      filename: resolve(
        HOME_DIR,
        ".ts-type-expand",
        "logs",
        "plugin",
        "error.log"
      ),
      level: "error",
    }),
  ],
})

const convertLogObject = (kind: string, obj: Record<string, unknown>) => {
  return {
    kind,
    ...obj,
  }
}

/**
 * pino で標準出力に向けてもデバッグコンソールに出力されないっぽい
 * production はさておき、開発中は console.log を使うべき
 */

export const logger = ((): ILogger => {
  return {
    info: (kind, obj, message) => {
      winstonLogger.info({
        message,
        ...convertLogObject(kind, obj),
      })
    },
    warn: (kind, obj, message) => {
      winstonLogger.warn({
        message,
        ...convertLogObject(kind, obj),
      })
    },
    error: (kind, obj, message) => {
      winstonLogger.error({
        message,
        ...convertLogObject(kind, obj),
      })
    },
  }
})()

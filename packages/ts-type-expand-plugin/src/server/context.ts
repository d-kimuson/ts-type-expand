import { Program } from "typescript"
import type { server } from "typescript/lib/tsserverlibrary"

export type Context = {
  program: Program | undefined
  createInfo: server.PluginCreateInfo | undefined
}

export const { setCreateInfo, getCreateInfo } = (() => {
  let createInfo: server.PluginCreateInfo | undefined = undefined

  return {
    setCreateInfo: (info: server.PluginCreateInfo) => {
      createInfo = info
    },
    getCreateInfo: (): server.PluginCreateInfo | undefined => createInfo,
  }
})()

export const createContext = async (): Promise<Context> => {
  const createInfo = getCreateInfo()
  const program = createInfo?.languageService.getProgram()

  return {
    createInfo,
    program,
  }
}

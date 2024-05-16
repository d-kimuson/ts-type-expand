import type { Program } from 'typescript'
import type { server } from 'typescript/lib/tsserverlibrary.js'

export type __ts = Parameters<server.PluginModuleFactory>[0]['typescript']

export type Context = {
  program: Program | undefined
  createInfo: server.PluginCreateInfo | undefined
  ts: __ts | undefined
}

export const { setTypescript, getTypescript } = (() => {
  let ts: __ts | undefined = undefined

  return {
    setTypescript: (_ts: __ts) => {
      ts = _ts
    },
    getTypescript: (): __ts | undefined => ts,
  }
})()

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
  const ts = getTypescript()
  const program = createInfo?.languageService.getProgram()

  return {
    createInfo,
    program,
    ts,
  }
}

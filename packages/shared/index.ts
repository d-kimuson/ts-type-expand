import { TypeObject } from 'compiler-api-helper'

export type CommonRes<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      message?: string
    }

export type FetchTypeFromPosReq = {
  filePath: string
  line: number
  character: number
}

export type FetchTypeFromPosRes = {
  declareName?: string
  type: TypeObject
}

export type GetObjectPropsReq = {
  storeKey: string
}

export type GetObjectPropsRes = {
  props: { propName: string; type: TypeObject }[]
}

export type IsActivatedRes = { isActivated: boolean }

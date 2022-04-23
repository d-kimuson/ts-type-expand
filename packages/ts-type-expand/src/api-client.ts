import axios, { AxiosInstance, AxiosResponse } from "axios"
import { TypeObject } from "compiler-api-helper"

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

export class ApiClient {
  private axiosClient: AxiosInstance

  constructor(port: number) {
    this.axiosClient = axios.create({
      baseURL: `http://localhost:${port}`,
    })
  }

  public async isActivated(): Promise<{ isActivated: boolean }> {
    const { data } = await this.axiosClient.get<{ isActivated: boolean }>(
      "/is_activated"
    )

    return data
  }

  public async getTypeFromLineAndCharacter(
    filePath: string,
    line: number,
    character: number
  ): Promise<FetchTypeFromPosRes | undefined> {
    try {
      const { data } = await this.axiosClient.post<
        FetchTypeFromPosReq,
        AxiosResponse<FetchTypeFromPosRes>
      >("/get_type_from_pos", {
        filePath,
        line,
        character,
      })
      return {
        declareName: data.declareName,
        type: data.type,
      }
    } catch (err) {
      console.log("Failed response: ", err)
      return undefined
    } finally {
      console.log("ended getTypeFromLineAndCharacter")
    }
  }

  public async getObjectProps(
    storeKey: string
  ): Promise<GetObjectPropsRes | undefined> {
    try {
      const { data } = await this.axiosClient.post<
        GetObjectPropsReq,
        AxiosResponse<GetObjectPropsRes>
      >("/get_object_props", { storeKey })
      console.log(`called getObjectProps with ${storeKey}`, data)
      return {
        props: data.props,
      }
    } catch (err) {
      console.log("Failed response: ", err)
      return undefined
    } finally {
      console.log("Ended getTypeFromLineAndCharacter")
    }
  }
}

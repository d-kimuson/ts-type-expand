import axios, { AxiosInstance, AxiosResponse } from "axios"
import { TypeObject } from "compiler-api-helper"
import { encycle } from "json-cyclic"
import { removeListener } from "process"

type FetchTypeFromPosReq = {
  filePath: string
  line: number
  character: number
}

type FetchTypeFromPosRes = {
  declareName?: string
  type: TypeObject
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
        type: encycle(data.type),
      }
    } catch (err) {
      console.log("Failed response: ", err)
      return undefined
    } finally {
      console.log("ended getTypeFromLineAndCharacter")
    }
  }
}

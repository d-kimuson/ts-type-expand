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

export class ApiClient {
  private axiosClient: AxiosInstance

  constructor(port: number) {
    this.axiosClient = axios.create({
      baseURL: `http://localhost:${port}`,
    })
  }

  public async getTypeFromLineAndCharacter(
    filePath: string,
    line: number,
    character: number
  ): Promise<FetchTypeFromPosRes | undefined> {
    try {
      console.log("called getTypeFromLineAndCharacter")
      const { data } = await this.axiosClient.post<
        FetchTypeFromPosReq,
        AxiosResponse<FetchTypeFromPosRes>
      >("/get_type_from_pos", {
        filePath,
        line,
        character,
      })
      return data
    } catch (err) {
      console.log("failed response: ", err)
      return undefined
    }
  }
}

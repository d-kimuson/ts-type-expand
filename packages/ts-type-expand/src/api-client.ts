import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios"
import type {
  CommonRes,
  FetchTypeFromPosReq,
  FetchTypeFromPosRes,
  GetObjectPropsReq,
  GetObjectPropsRes,
  IsActivatedRes,
} from "shared"

export class ApiClient {
  private axiosClient: AxiosInstance
  private interceptorIds: number[]

  constructor(
    private port: number,
    private onError?: (
      error: AxiosError<{ message: string } | undefined>
    ) => void
  ) {
    this.axiosClient = axios.create({
      baseURL: `http://localhost:${port}`,
    })
    const id = this.axiosClient.interceptors.response.use(
      (res) => {
        if (res === undefined) {
          return {
            data: {
              success: false,
            },
          }
        }

        return res
      },
      (err: AxiosError<{ message: string } | undefined>) => {
        if (typeof onError === "function") {
          onError(err)
        }
        throw err
      }
    )
    this.interceptorIds = [id]
  }

  public updatePort(port: number) {
    this.interceptorIds.forEach((id) => {
      this.axiosClient.interceptors.response.eject(id)
    })
    this.axiosClient = axios.create({
      baseURL: `http://localhost:${port}`,
    })
    const id = this.axiosClient.interceptors.response.use(
      (res) => {
        if (res === undefined) {
          return {
            data: {
              success: false,
            },
          }
        }

        return res
      },
      (err: AxiosError<{ message: string } | undefined>) => {
        if (typeof this.onError === "function") {
          this.onError(err)
        }
        throw err
      }
    )
    this.interceptorIds = [id]
  }

  public async isActivated(): Promise<IsActivatedRes> {
    const { data } = await this.axiosClient.get<CommonRes<IsActivatedRes>>(
      "/is_activated"
    )

    if (!data.success) {
      return { isActivated: false }
    }

    return data.data
  }

  public async getTypeFromLineAndCharacter(
    filePath: string,
    line: number,
    character: number
  ): Promise<FetchTypeFromPosRes | undefined> {
    try {
      const { data } = await this.axiosClient.post<
        FetchTypeFromPosReq,
        AxiosResponse<CommonRes<FetchTypeFromPosRes>>
      >("/get_type_from_pos", {
        filePath,
        line,
        character,
      })

      if (!data.success) {
        return
      }

      return {
        declareName: data.data.declareName,
        type: data.data.type,
      }
    } catch (err) {
      // @ts-expect-error
      console.error("Failed response: ", err, err.response?.status)
      return undefined
    }
  }

  public async getObjectProps(
    storeKey: string
  ): Promise<GetObjectPropsRes | undefined> {
    try {
      const { data } = await this.axiosClient.post<
        GetObjectPropsReq,
        AxiosResponse<CommonRes<GetObjectPropsRes>>
      >("/get_object_props", { storeKey })
      if (!data.success) {
        return
      }

      return {
        props: data.data.props,
      }
    } catch (err) {
      console.error("Failed Response: ", err)
      return undefined
    }
  }
}

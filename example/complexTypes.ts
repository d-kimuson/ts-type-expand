import { User } from "./types"

// generics
export interface MyStore<T> {
  value: T
  get: (key: string) => T
  set: (key: string, value: T) => void
}
export type UserStore = MyStore<User>

// mappted type
export type MappedType<T> = {
  [K in keyof T]: number
}
export type UserMappedType = MappedType<{
  key1: string
  key2: number
  key3: boolean
}>

// conditional type
export type Conditional<T> = T extends undefined ? Exclude<T, undefined> : T
export type TreeCond = Conditional<string | undefined>
export type FalseCond = Conditional<string | null>

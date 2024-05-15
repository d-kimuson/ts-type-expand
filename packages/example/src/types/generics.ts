// should be skipped
export type GenericsWithDefault<T = string> = {
  value: T
}

// should be skipped
export type GenericsWithNoDefault<T extends string, Y = string> = {
  value: T
}

// should be resolved
export type ResolvedGenerics = Partial<{
  id: number
  time: Date
}>

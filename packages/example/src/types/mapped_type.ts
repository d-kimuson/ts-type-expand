type Key = 1 | 2 | 3

export type MappedType = {
  [key in Key]: string
}

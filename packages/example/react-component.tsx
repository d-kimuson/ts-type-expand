import type { FC, PropsWithChildren } from "react"

type Props = PropsWithChildren<{
  name: string
}>

export const Component: FC<Props> = ({ name, children }) => {
  return (
    <div>
      <h2>{name}</h2>
      <div>{children}</div>
    </div>
  )
}

import { expectType } from "tsd"

describe("Jest", () => {
  it("test is available", () => {
    expect(true).toBe(true)
  })

  it("type test is available", () => {
    expectType<boolean>(true)
  })
})

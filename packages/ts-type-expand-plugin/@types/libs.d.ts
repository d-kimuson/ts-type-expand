declare module "json-cyclic" {
  // 実態は異なるが encycle するので戻り値もTということにする
  export const decycle: <T>(recursiveJson: T) => T
}

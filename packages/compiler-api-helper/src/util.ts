export type Result<S, T> = ResultOk<S> | ResultNg<T>
export type ResultOk<T> = {
  __type: "ok"
  ok: T
}
export type ResultNg<T> = {
  __type: "ng"
  ng: T
}

export function isOk<T, E>(result: Result<T, E>): result is ResultOk<T> {
  return result.__type === "ok"
}

export function isNg<T, E>(result: Result<T, E>): result is ResultNg<E> {
  return result.__type === "ng"
}

export function ok<T>(value: T): ResultOk<T> {
  return {
    __type: "ok",
    ok: value,
  }
}

export function ng<T>(value: T): ResultNg<T> {
  return {
    __type: "ng",
    ng: value,
  }
}

type IsMatch<T> = (target: T) => boolean
type SwitchResolve<Arg, R> = (arg: Arg) => R

type SwitchResult<T, R> = {
  case: <
    CaseR,
    // eslint-disable-next-line @typescript-eslint/ban-types
    Predicate = {},
    Resolved = Omit<T, keyof Predicate> & Predicate
  >(
    isMatch: (target: T) => boolean,
    resolve: SwitchResolve<Resolved, CaseR>
  ) => SwitchResult<T, R | CaseR>
  default: <Default>(resolve: SwitchResolve<T, Default>) => R | Default
  resolved?: R
}

const toResult = <T, R, ExtractT = T>(
  target: T,
  isParentMatch: IsMatch<T>,
  resolveParent: SwitchResolve<ExtractT, R>,
  parentResolved: R | undefined
): SwitchResult<T, R> => {
  const resolved =
    typeof parentResolved === "undefined"
      ? isParentMatch(target)
        ? resolveParent(target as unknown as ExtractT)
        : undefined
      : parentResolved

  return {
    resolved,
    default: <Default>(resolveDefault: (arg: T) => Default): R | Default =>
      resolved ?? resolveDefault(target),
    case: <
      CaseR,
      Predicate extends {
        [K in keyof T]?: T[K]
        // eslint-disable-next-line @typescript-eslint/ban-types
      } = {},
      Resolved = Omit<T, keyof Predicate> & Predicate
    >(
      isMatch: (target: T) => boolean,
      resolve: SwitchResolve<Resolved, CaseR>
    ): SwitchResult<T, R | CaseR> =>
      toResult<T, R | CaseR, Resolved>(target, isMatch, resolve, resolved),
  }
}

export const switchExpression = <T>(target: T): SwitchResult<T, never> => {
  return {
    resolved: undefined,
    default: <Default>(resolveDefault: (arg: T) => Default): Default =>
      resolveDefault(target),
    case: <
      CaseR,
      // eslint-disable-next-line @typescript-eslint/ban-types
      Predicate = {},
      Resolved = Omit<T, keyof Predicate> & Predicate
    >(
      isMatch: IsMatch<T>,
      resolve: SwitchResolve<Resolved, CaseR>
    ): SwitchResult<T, CaseR> =>
      toResult<T, CaseR, Resolved>(target, isMatch, resolve, undefined),
  }
}

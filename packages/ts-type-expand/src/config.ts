export const tsTypeExpandConfig = {
  extensionId: 'ts-type-expand',
  menuId: 'tsTypeExpand',
  command: (value: string) => `${tsTypeExpandConfig.extensionId}.${value}`,
} as const

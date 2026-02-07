export function getBlockName(type: string, t: (key: string) => string): string {
  return t(`blocks.${type}`) || type
}

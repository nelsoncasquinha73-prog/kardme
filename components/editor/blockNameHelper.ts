export function getBlockName(type: string, t: (key: string) => string): string {
  console.log('getBlockName called:', type, 'result:', t(`blocks.${type}`))
  return t(`blocks.${type}`) || type
}

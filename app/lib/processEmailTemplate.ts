export function processEmailTemplate(template: string, variables: Record<string, string>): string {
  let result = template

  // Replace variables in format {nome}, {email}, etc.
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    result = result.replace(regex, value || '')
  }

  return result
}

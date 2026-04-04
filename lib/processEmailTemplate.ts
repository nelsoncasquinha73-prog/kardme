export function processEmailTemplate(
  template: string,
  variables: Record<string, string | null | undefined>
): string {
  let html = template

  Object.entries(variables).forEach(([key, value]) => {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\{${escapedKey}\\}`, 'g')
    html = html.replace(regex, value || '')
  })

  const paragraphs = html
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  const htmlParagraphs = paragraphs.map((para) => {
    const withLineBreaks = para
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('<br />')

    return `<p>${withLineBreaks}</p>`
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    p {
      margin: 0 0 16px 0;
      font-size: 14px;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
${htmlParagraphs.join('\n')}
</body>
</html>
  `.trim()
}

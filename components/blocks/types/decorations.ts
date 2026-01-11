export type DecorationItem = {
  id: string
  src: string            // emoji svg / png / upload
  x: number              // 0–100 (%)
  y: number              // 0–100 (%)
  scale?: number         // 1 = normal
  rotate?: number        // graus
  opacity?: number       // 0–1
  zIndex?: number
}

export type DecorationsSettings = {
  enabled?: boolean
  items: DecorationItem[]
}

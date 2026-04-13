/**
 * Sistema de gradientes animados para HeaderBlock
 */

export type AnimatedGradientSpeed = 'slow' | 'normal' | 'fast'
export type AnimatedGradientStyle = 'shift' | 'pulse' | 'wave'

export interface AnimatedGradientOverlay {
  kind: 'animated-gradient'
  colors: string[] // 2-4 cores
  speed: AnimatedGradientSpeed
  style: AnimatedGradientStyle
  angle: number
}

export function getAnimationDuration(speed: AnimatedGradientSpeed): number {
  switch (speed) {
    case 'slow': return 12
    case 'normal': return 8
    case 'fast': return 4
  }
}

export function generateAnimatedGradientCSS(
  id: string,
  colors: string[],
  style: AnimatedGradientStyle,
  angle: number,
  speed: AnimatedGradientSpeed
): { keyframes: string; animationName: string; duration: number } {
  const duration = getAnimationDuration(speed)
  const animationName = `ag_${id}_${style}`

  let keyframes = ''

  if (style === 'shift') {
    // Gradiente que roda suavemente
    keyframes = `
      @keyframes ${animationName} {
        0% { background: linear-gradient(${angle}deg, ${colors.join(', ')}); }
        50% { background: linear-gradient(${angle + 180}deg, ${colors.join(', ')}); }
        100% { background: linear-gradient(${angle}deg, ${colors.join(', ')}); }
      }
    `
  } else if (style === 'pulse') {
    // Cores pulsam suavemente
    const frames = colors.map((_, i) => {
      const percent = (i / colors.length) * 100
      const nextColor = colors[(i + 1) % colors.length]
      return `${percent}% { background: linear-gradient(${angle}deg, ${colors[i]}, ${nextColor}); }`
    }).join('\n')
    keyframes = `
      @keyframes ${animationName} {
        ${frames}
        100% { background: linear-gradient(${angle}deg, ${colors[0]}, ${colors[1]}); }
      }
    `
  } else if (style === 'wave') {
    // Onda suave
    keyframes = `
      @keyframes ${animationName} {
        0% { background: linear-gradient(${angle}deg, ${colors[0]} 0%, ${colors[colors.length - 1]} 100%); }
        25% { background: linear-gradient(${angle + 45}deg, ${colors[0]} 0%, ${colors[colors.length - 1]} 100%); }
        50% { background: linear-gradient(${angle + 90}deg, ${colors[0]} 0%, ${colors[colors.length - 1]} 100%); }
        75% { background: linear-gradient(${angle + 45}deg, ${colors[0]} 0%, ${colors[colors.length - 1]} 100%); }
        100% { background: linear-gradient(${angle}deg, ${colors[0]} 0%, ${colors[colors.length - 1]} 100%); }
      }
    `
  }

  return { keyframes, animationName, duration }
}

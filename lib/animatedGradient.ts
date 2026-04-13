/**
 * Sistema de gradientes animados
 */

export type AnimatedGradientSpeed = 'slow' | 'normal' | 'fast'
export type AnimatedGradientStyle = 'shift' | 'pulse' | 'wave'

export interface AnimatedGradientOverlay {
  kind: 'animated-gradient'
  colors: string[]
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
    keyframes = `
      @keyframes ${animationName} {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `
  } else if (style === 'pulse') {
    keyframes = `
      @keyframes ${animationName} {
        0% { background-position: 50% 50%; transform: scale(1); }
        50% { background-position: 60% 40%; transform: scale(1.03); }
        100% { background-position: 50% 50%; transform: scale(1); }
      }
    `
  } else if (style === 'wave') {
    keyframes = `
      @keyframes ${animationName} {
        0% { background-position: 0% 50%; }
        25% { background-position: 50% 100%; }
        50% { background-position: 100% 50%; }
        75% { background-position: 50% 0%; }
        100% { background-position: 0% 50%; }
      }
    `
  }

  return { keyframes, animationName, duration }
}

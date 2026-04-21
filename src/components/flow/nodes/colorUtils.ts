/** Shared color utilities for dynamic hex-based node theming */

export type ColorScheme = {
  bg: string
  border: string
  accent: string
  text: string
  iconBg: string
  iconStroke: string
}

function hexToHSL(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex : `#${hex}`
  const r = parseInt(h.slice(1, 3), 16) / 255
  const g = parseInt(h.slice(3, 5), 16) / 255
  const b = parseInt(h.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let hue = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: hue = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: hue = ((b - r) / d + 2) / 6; break
      case b: hue = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(hue * 360), Math.round(s * 100), Math.round(l * 100)]
}

/** Derive a harmonious color scheme from any hex color */
export function hexToScheme(hex: string): ColorScheme {
  try {
    const normalized = hex.startsWith('#') ? hex : `#${hex}`
    const [h, s] = hexToHSL(normalized)
    const sat = Math.min(s, 38)
    return {
      bg: `hsl(${h}, ${sat}%, 95.5%)`,
      border: `hsl(${h}, ${Math.min(s + 8, 55)}%, 72%)`,
      accent: normalized,
      text: `hsl(${h}, ${Math.min(s, 62)}%, 19%)`,
      iconBg: `hsl(${h}, ${sat}%, 89%)`,
      iconStroke: normalized,
    }
  } catch {
    return {
      bg: '#f5f5f5',
      border: '#d1d5db',
      accent: '#6b7280',
      text: '#374151',
      iconBg: '#e5e7eb',
      iconStroke: '#6b7280',
    }
  }
}

/** Returns true if the string is a valid 6-digit hex color */
export function isHexColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color)
}

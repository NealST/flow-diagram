import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HexColorPicker } from 'react-colorful'
import { NodeIcon, PaletteIcon } from '../icons'

// ── Named color → hex lookup ─────────────────────────────────────────────────
export const COLOR_HEX: Record<string, string> = {
  blue:   '#3b7dc0',
  green:  '#3a8f4f',
  orange: '#c07830',
  purple: '#7050a0',
  teal:   '#2ba3a0',
  pink:   '#b05a8c',
  red:    '#b54e4e',
  gray:   '#6b7280',
  yellow: '#b8960a',
  amber:  '#b8850a',
}

// Panel dimensions for placement math (generous to account for picker expansion)
const PANEL_W        = 220
const PANEL_H_BASE   = 310  // colors + picker section
const PANEL_H_ICONS  = 480  // colors + picker + icon grid
const SIDE_GAP       = 10

type Props = {
  color: string
  icon?: string
  colors: string[]
  icons?: string[]
  onColorChange: (color: string) => void
  onIconChange?: (icon: string) => void
}

export function NodeStylePopover({ color, icon, colors, icons, onColorChange, onIconChange }: Props) {
  const [open, setOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0, anchorLeft: false })
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Derive current hex for the custom section
  const currentHex = COLOR_HEX[color] ?? (color.startsWith('#') ? color : '#888888')
  const isCustomColor = color.startsWith('#')

  // Hex input state — mirrors currentHex, allows in-progress typing
  const [hexInput, setHexInput] = useState(currentHex)
  useEffect(() => {
    setHexInput(COLOR_HEX[color] ?? (color.startsWith('#') ? color : '#888888'))
  }, [color])

  // ── Positioning ──────────────────────────────────────────────────────────────
  const getNodeRect = () =>
    btnRef.current?.parentElement?.parentElement?.getBoundingClientRect() ?? null

  const calcPos = () => {
    const nodeRect = getNodeRect()
    if (!nodeRect) return null
    // Use panel's actual rendered height if available, else fall back to estimate
    const panelH = panelRef.current
      ? (panelRef.current.getBoundingClientRect().height || (icons ? PANEL_H_ICONS : PANEL_H_BASE))
      : (icons ? PANEL_H_ICONS : PANEL_H_BASE)

    let x = nodeRect.right + SIDE_GAP
    let anchorLeft = false
    if (x + PANEL_W > window.innerWidth - 8) {
      x = nodeRect.left - PANEL_W - SIDE_GAP
      anchorLeft = true
    }
    x = Math.max(8, x)

    let y = nodeRect.top
    if (y + panelH > window.innerHeight - 8) {
      y = window.innerHeight - panelH - 8
    }
    y = Math.max(8, y)
    return { x, y, anchorLeft }
  }

  const openPopover = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (open) { setOpen(false); setPickerOpen(false); return }
    const p = calcPos()
    if (p) setPos(p)
    setOpen(true)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) { setOpen(false); setPickerOpen(false) }
    }
    // Use capture phase so ReactFlow's stopPropagation on the canvas doesn't block this
    document.addEventListener('mousedown', handler, true)
    return () => document.removeEventListener('mousedown', handler, true)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setPickerOpen(false) }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  // Reposition on scroll/resize/panel resize
  useEffect(() => {
    if (!open) return
    const reposition = () => {
      const p = calcPos()
      if (p) setPos(p)
    }
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    const ro = new ResizeObserver(reposition)
    if (panelRef.current) ro.observe(panelRef.current)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
      ro.disconnect()
    }
  }, [open, icons])

  // ── Color handlers ───────────────────────────────────────────────────────────
  const handleSwatchClick = (c: string) => {
    onColorChange(c)
    setPickerOpen(false)
  }

  const handlePickerChange = (hex: string) => {
    setHexInput(hex)
    onColorChange(hex)
  }

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setHexInput(val)
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      onColorChange(val)
    }
  }

  const handleHexInputBlur = () => {
    let val = hexInput.trim()
    if (!val.startsWith('#')) val = `#${val}`
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      setHexInput(val)
      onColorChange(val)
    } else {
      setHexInput(COLOR_HEX[color] ?? (color.startsWith('#') ? color : '#888888'))
    }
  }

  // ── Panel JSX ────────────────────────────────────────────────────────────────
  const panel = (
    <div
      ref={panelRef}
      className={`node-style-popover${open ? ' open' : ''}`}
      style={{
        left: pos.x,
        top: pos.y,
        width: PANEL_W,
        transformOrigin: pos.anchorLeft ? 'top right' : 'top left',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* ── Preset swatches ── */}
      <div className="node-style-section-label">颜色</div>
      <div className="node-style-colors">
        {colors.map(c => (
          <button
            key={c}
            className={`node-style-color-swatch${color === c ? ' active' : ''}`}
            style={{ background: COLOR_HEX[c] ?? '#888' }}
            onClick={() => handleSwatchClick(c)}
            title={c}
            aria-label={c}
          />
        ))}
        {/* Rainbow "custom" swatch — active ring when current color is hex */}
        <button
          className={`node-style-color-swatch node-style-custom-swatch${isCustomColor ? ' active' : ''}${pickerOpen ? ' picker-open' : ''}`}
          style={isCustomColor ? { background: currentHex } : undefined}
          onClick={() => setPickerOpen(v => !v)}
          title="自定义颜色"
          aria-label="自定义颜色"
        />
      </div>

      {/* ── Hex input row (always visible) ── */}
      <div className="node-style-hex-row">
        <div
          className="node-style-hex-preview"
          style={{ background: currentHex }}
          onClick={() => setPickerOpen(v => !v)}
          title="点击打开调色板"
        />
        <input
          className="node-style-hex-input"
          value={hexInput}
          onChange={handleHexInputChange}
          onFocus={() => setPickerOpen(true)}
          onBlur={handleHexInputBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            e.stopPropagation()
          }}
          onClick={(e) => e.stopPropagation()}
          spellCheck={false}
          maxLength={7}
          placeholder="#000000"
        />
      </div>

      {/* ── Expandable HexColorPicker ── */}
      <div className={`node-style-picker-wrap${pickerOpen ? ' open' : ''}`}>
        <HexColorPicker
          color={currentHex}
          onChange={handlePickerChange}
        />
      </div>

      {/* ── Icon section ── */}
      {icons && onIconChange && (
        <>
          <div className="node-style-section-label" style={{ marginTop: '9px' }}>图标</div>
          <div className="node-style-icons">
            {icons.map(ic => (
              <button
                key={ic}
                className={`node-style-icon-btn${icon === ic ? ' active' : ''}`}
                onClick={() => onIconChange(ic)}
                title={ic}
                aria-label={ic}
              >
                <NodeIcon icon={ic} size={13} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )

  return (
    <div
      className={`node-style-container nodrag nopan${open ? ' is-open' : ''}`}
      style={{ position: 'absolute', top: '-9px', right: '-9px', zIndex: 10 }}
    >
      <button
        ref={btnRef}
        className="node-style-btn"
        onClick={openPopover}
        title="调整样式"
        aria-label="调整样式"
      >
        <PaletteIcon size={10} />
      </button>

      {createPortal(panel, document.body)}
    </div>
  )
}

// ── Per-node preset configs ─────────────────────────────────────────────────

export const ROLE_COLORS     = ['blue', 'green', 'orange', 'purple', 'pink', 'teal', 'red']
export const PROCESS_COLORS  = ['blue', 'green', 'orange', 'purple']
export const GROUP_COLORS    = ['blue', 'green', 'orange', 'purple', 'gray']
export const TEXT_COLORS     = ['yellow', 'blue', 'green', 'pink', 'gray']
export const DECISION_COLORS = ['amber', 'blue', 'red', 'purple']
export const TRIGGER_COLORS  = ['teal', 'orange', 'purple', 'blue']
export const API_COLORS      = ['blue', 'green', 'orange', 'red']

export const ROLE_ICONS = [
  'user', 'brain', 'cpu', 'wrench', 'database', 'gear', 'box',
  'message', 'book', 'globe', 'folder', 'sparkle', 'alert', 'send',
  'rocket', 'network', 'zap', 'link', 'package', 'filetext',
  'clipboard', 'settings',
]

export const TRIGGER_ICONS = [
  'zap', 'send', 'alert', 'rocket', 'sparkle', 'message',
  'network', 'globe', 'link', 'gear',
]

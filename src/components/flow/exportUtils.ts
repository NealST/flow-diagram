/**
 * Export utilities for flow diagrams.
 * Uses html-to-image for accurate rendering of React Flow's HTML+SVG nodes.
 * Supports: PNG, SVG, Animated SVG, WebM video, JSON.
 */
import { toPng, toSvg } from 'html-to-image'
import { getViewportForBounds, type Rect } from '@xyflow/react'

const EXPORT_PADDING = 20 // px of whitespace on each side

/** Get the .react-flow__viewport element, the target for html-to-image */
function getViewportEl(container: HTMLElement): HTMLElement | null {
  return container.querySelector('.react-flow__viewport') as HTMLElement | null
}

/** Common filter: hide controls, minimap, attribution, handles, selection indicators */
function exportFilter(node: HTMLElement | SVGElement): boolean {
  const exclude = [
    'react-flow__minimap',
    'react-flow__controls',
    'react-flow__panel',
    'react-flow__attribution',
    'export-panel-container',
    'react-flow__handle',
    'react-flow__nodesselection',
    'react-flow__selection',
    'react-flow__resize-control',
  ]
  if (node.classList) {
    for (const cls of exclude) {
      if (node.classList.contains(cls)) return false
    }
  }
  return true
}

/** Inject temporary CSS to hide selection states + handles during capture */
function injectExportStyles(viewport: HTMLElement): HTMLStyleElement {
  const style = document.createElement('style')
  style.textContent = `
    .react-flow__handle { display: none !important; }
    .react-flow__node.selected > * { outline: none !important; box-shadow: none !important; }
    .react-flow__node.selected { outline: none !important; }
    .react-flow__nodesselection-rect { display: none !important; }
  `
  viewport.appendChild(style)
  return style
}

// ─── Static PNG Export ──────────────────────────────────────────────
export async function exportToPNG(
  container: HTMLElement,
  nodesBounds: Rect,
  scale = 2,
): Promise<void> {
  const viewport = getViewportEl(container)
  if (!viewport) throw new Error('Cannot find React Flow viewport')

  const imageWidth = nodesBounds.width + EXPORT_PADDING * 2
  const imageHeight = nodesBounds.height + EXPORT_PADDING * 2

  // padding arg is a ratio (0 = no extra padding); pixel padding is already in imageWidth/Height
  const transform = getViewportForBounds(
    nodesBounds,
    imageWidth,
    imageHeight,
    0.5,
    2,
    0,
  )

  const tempStyle = injectExportStyles(viewport)
  try {
    const dataUrl = await toPng(viewport, {
      backgroundColor: '#ffffff',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
      pixelRatio: scale,
      filter: exportFilter,
    })
    download(dataUrl, 'flow-diagram.png')
  } finally {
    viewport.removeChild(tempStyle)
  }
}

// ─── Static SVG Export ──────────────────────────────────────────────
export async function exportToSVG(
  container: HTMLElement,
  nodesBounds: Rect,
): Promise<void> {
  const viewport = getViewportEl(container)
  if (!viewport) throw new Error('Cannot find React Flow viewport')

  const imageWidth = nodesBounds.width + EXPORT_PADDING * 2
  const imageHeight = nodesBounds.height + EXPORT_PADDING * 2

  const transform = getViewportForBounds(
    nodesBounds,
    imageWidth,
    imageHeight,
    0.5,
    2,
    0,
  )

  const tempStyle = injectExportStyles(viewport)
  try {
    const dataUrl = await toSvg(viewport, {
      backgroundColor: '#ffffff',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
      filter: exportFilter,
    })
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    downloadBlob(blob, 'flow-diagram.svg')
  } finally {
    viewport.removeChild(tempStyle)
  }
}

// ─── Animated SVG Export ────────────────────────────────────────────
// Exports the SVG with CSS animations preserved (dash flow + particles)
export async function exportToAnimatedSVG(
  container: HTMLElement,
  nodesBounds: Rect,
): Promise<void> {
  const viewport = getViewportEl(container)
  if (!viewport) throw new Error('Cannot find React Flow viewport')

  const imageWidth = nodesBounds.width + EXPORT_PADDING * 2
  const imageHeight = nodesBounds.height + EXPORT_PADDING * 2

  const transform = getViewportForBounds(
    nodesBounds,
    imageWidth,
    imageHeight,
    0.5,
    2,
    0,
  )

  const tempStyle = injectExportStyles(viewport)
  let dataUrl: string
  try {
    dataUrl = await toSvg(viewport, {
      backgroundColor: '#ffffff',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
      filter: exportFilter,
    })
  } finally {
    viewport.removeChild(tempStyle)
  }

  // Inject animation keyframes into the exported SVG
  const svgText = decodeURIComponent(dataUrl.split(',')[1] ?? '')
  const animatedSvg = svgText.replace(
    '</style>',
    `
    @keyframes flow-dash { to { stroke-dashoffset: -28; } }
    .animated-edge-dash { animation: flow-dash linear infinite; }
    </style>`,
  )

  const blob = new Blob([animatedSvg], { type: 'image/svg+xml;charset=utf-8' })
  downloadBlob(blob, 'flow-diagram-animated.svg')
}

// ─── Video (WebM) Recording ─────────────────────────────────────────
export function startVideoRecording(container: HTMLElement): {
  stop: () => void
  recording: Promise<Blob>
} {
  // Use the whole react-flow container for video capture
  const el = container.querySelector('.react-flow') as HTMLElement ?? container
  const bounds = el.getBoundingClientRect()
  const dpr = Math.min(2, window.devicePixelRatio)

  const canvas = document.createElement('canvas')
  canvas.width = bounds.width * dpr
  canvas.height = bounds.height * dpr
  const ctx = canvas.getContext('2d')!

  const stream = canvas.captureStream(30)
  const recorder = new MediaRecorder(stream, {
    mimeType: getSupportedMimeType(),
    videoBitsPerSecond: 5_000_000,
  })

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  let stopped = false
  const recording = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }))
    }
  })

  // Capture frames by snapshotting with toPng
  let pending = false
  let rafId: number

  const captureFrame = async () => {
    if (stopped) return
    if (!pending) {
      pending = true
      try {
        const dataUrl = await toPng(el, {
          width: bounds.width,
          height: bounds.height,
          pixelRatio: dpr,
          filter: exportFilter,
          skipAutoScale: true,
        })
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
        img.src = dataUrl
      } catch {
        // frame skip
      }
      pending = false
    }
    rafId = requestAnimationFrame(captureFrame)
  }

  recorder.start(100)
  captureFrame()

  return {
    stop: () => {
      stopped = true
      cancelAnimationFrame(rafId)
      recorder.stop()
    },
    recording,
  }
}

// ─── JSON Data Export ───────────────────────────────────────────────
export function exportToJSON(nodes: unknown[], edges: unknown[]): void {
  const data = { nodes, edges, exportedAt: new Date().toISOString() }
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, 'flow-diagram.json')
}

// ─── Helpers ────────────────────────────────────────────────────────
function download(dataUrl: string, filename: string) {
  // Convert data URL to blob for more reliable downloads
  const byteString = atob(dataUrl.split(',')[1] ?? '')
  const mimeString = dataUrl.split(',')[0]?.split(':')[1]?.split(';')[0] ?? 'application/octet-stream'
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  const blob = new Blob([ab], { type: mimeString })
  downloadBlob(blob, filename)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  // Use mouse event for better compatibility
  a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
  // Cleanup after a delay
  requestAnimationFrame(() => {
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  })
}

function getSupportedMimeType(): string {
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return 'video/webm'
}

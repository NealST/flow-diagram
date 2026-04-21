import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useReactFlow } from '@xyflow/react'
import { DownloadIcon, ImageIcon, RulerIcon, SparkleIcon, FilmIcon, PackageIcon, CheckIcon, LoaderIcon } from './icons'
import {
  exportToPNG,
  exportToSVG,
  exportToAnimatedSVG,
  startVideoRecording,
  exportToJSON,
} from './exportUtils'

type ExportPanelProps = {
  canvasRef: React.RefObject<HTMLDivElement | null>
  headerActionsRef: React.RefObject<HTMLDivElement | null>
}

export function ExportPanel({ canvasRef, headerActionsRef }: ExportPanelProps) {
  const { getNodes, getEdges, getNodesBounds } = useReactFlow()
  const [open, setOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordTime, setRecordTime] = useState(0)
  const [exporting, setExporting] = useState<string | null>(null)
  const recorderRef = useRef<{ stop: () => void; recording: Promise<Blob> } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>(null)
  const [portalReady, setPortalReady] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      // Check both the toggle button (inside portal) and the dropdown container
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const getContainer = useCallback(() => {
    return canvasRef.current?.querySelector('.react-flow') as HTMLElement | null
  }, [canvasRef])

  const handleExportPNG = useCallback(async () => {
    const el = getContainer()
    if (!el) return
    setExporting('png')
    try {
      const bounds = getNodesBounds(getNodes())
      await exportToPNG(el, bounds, 2)
      setExporting('done')
      setTimeout(() => setExporting(null), 1500)
    } catch (e) {
      console.error('PNG export failed:', e)
      setExporting(null)
    }
  }, [getContainer, getNodes, getNodesBounds])

  const handleExportSVG = useCallback(async () => {
    const el = getContainer()
    if (!el) return
    setExporting('svg')
    try {
      const bounds = getNodesBounds(getNodes())
      await exportToSVG(el, bounds)
      setExporting('done')
      setTimeout(() => setExporting(null), 1500)
    } catch (e) {
      console.error('SVG export failed:', e)
      setExporting(null)
    }
  }, [getContainer, getNodes, getNodesBounds])

  const handleExportAnimatedSVG = useCallback(async () => {
    const el = getContainer()
    if (!el) return
    setExporting('asvg')
    try {
      const bounds = getNodesBounds(getNodes())
      await exportToAnimatedSVG(el, bounds)
      setExporting('done')
      setTimeout(() => setExporting(null), 1500)
    } catch (e) {
      console.error('Animated SVG export failed:', e)
      setExporting(null)
    }
  }, [getContainer, getNodes, getNodesBounds])

  const handleStartRecording = useCallback(() => {
    const el = getContainer()
    if (!el) return
    try {
      const recorder = startVideoRecording(el)
      recorderRef.current = recorder
      setRecording(true)
      setRecordTime(0)
      timerRef.current = setInterval(() => {
        setRecordTime((t) => t + 1)
      }, 1000)
    } catch (e) {
      console.error('Recording failed:', e)
    }
  }, [getContainer])

  const handleStopRecording = useCallback(async () => {
    if (!recorderRef.current) return
    recorderRef.current.stop()
    const blob = await recorderRef.current.recording
    recorderRef.current = null
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
    setRecordTime(0)

    // Download
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flow-diagram.webm'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, [])

  const handleExportJSON = useCallback(() => {
    exportToJSON(getNodes(), getEdges())
  }, [getNodes, getEdges])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  if (!portalReady || !headerActionsRef.current) return null

  const panelUI = (
    <div className="export-panel-container" ref={containerRef}>
      {/* Toggle button — lives in header */}
      <button
        className="export-toggle-btn"
        onClick={() => setOpen((v) => !v)}
        title="导出"
        data-active={open}
      >
        {recording ? (
          <span className="export-recording-dot" />
        ) : (
          <DownloadIcon size={15} />
        )}
        <span>{recording ? formatTime(recordTime) : '导出'}</span>
      </button>

      {/* Dropdown — fixed below header */}
      {open && (
        <div className="export-dropdown">
          <div className="export-dropdown-header">
            导出流程图
            {exporting === 'done' && <span className="export-status-done"><CheckIcon size={13} /> 导出成功</span>}
            {exporting && exporting !== 'done' && <span className="export-status-busy"><LoaderIcon size={13} /> 导出中...</span>}
          </div>

          <div className="export-section">
            <div className="export-section-label">静态导出</div>
            <button className="export-option" onClick={handleExportPNG} disabled={!!exporting && exporting !== 'done'}>
              <span className="export-option-icon"><ImageIcon size={16} /></span>
              <div>
                <div className="export-option-title">PNG 图片</div>
                <div className="export-option-desc">高清 2x 位图，适合分享</div>
              </div>
            </button>
            <button className="export-option" onClick={handleExportSVG} disabled={!!exporting && exporting !== 'done'}>
              <span className="export-option-icon"><RulerIcon size={16} /></span>
              <div>
                <div className="export-option-title">SVG 矢量图</div>
                <div className="export-option-desc">无损缩放，适合打印</div>
              </div>
            </button>
          </div>

          <div className="export-section">
            <div className="export-section-label">动画导出</div>
            <button className="export-option" onClick={handleExportAnimatedSVG} disabled={!!exporting && exporting !== 'done'}>
              <span className="export-option-icon"><SparkleIcon size={16} /></span>
              <div>
                <div className="export-option-title">动画 SVG</div>
                <div className="export-option-desc">保留流动效果，可嵌入网页</div>
              </div>
            </button>
            {!recording ? (
              <button className="export-option" onClick={handleStartRecording}>
                <span className="export-option-icon"><FilmIcon size={16} /></span>
                <div>
                  <div className="export-option-title">录制视频 (WebM)</div>
                  <div className="export-option-desc">录制画布动画为视频</div>
                </div>
              </button>
            ) : (
              <button className="export-option export-option-recording" onClick={handleStopRecording}>
                <span className="export-recording-dot" />
                <div>
                  <div className="export-option-title">
                    停止录制 {formatTime(recordTime)}
                  </div>
                  <div className="export-option-desc">点击保存 WebM 视频</div>
                </div>
              </button>
            )}
          </div>

          <div className="export-section">
            <div className="export-section-label">数据</div>
            <button className="export-option" onClick={handleExportJSON}>
              <span className="export-option-icon"><PackageIcon size={16} /></span>
              <div>
                <div className="export-option-title">JSON 数据</div>
                <div className="export-option-desc">节点与连线数据，可导入恢复</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )

  return createPortal(panelUI, headerActionsRef.current)
}

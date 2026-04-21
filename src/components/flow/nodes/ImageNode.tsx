import { useRef, useState } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { useReactFlow } from '@xyflow/react'
import { ImageIcon } from '../icons'

export type ImageNodeData = {
  src?: string
  caption?: string
}

export function ImageNode({ id, data }: NodeProps<Node<ImageNodeData>>) {
  const { updateNodeData } = useReactFlow()
  const [editingUrl, setEditingUrl] = useState(false)
  const [editingCaption, setEditingCaption] = useState(false)
  const [urlDraft, setUrlDraft] = useState(data.src ?? '')
  const [imgError, setImgError] = useState(false)
  const urlInputRef = useRef<HTMLInputElement>(null)

  const hasImage = !!data.src && !imgError

  const commitUrl = (val: string) => {
    const trimmed = val.trim()
    updateNodeData(id, { src: trimmed || undefined })
    setImgError(false)
    setEditingUrl(false)
  }

  const openUrlEditor = (e: React.MouseEvent) => {
    e.stopPropagation()
    setUrlDraft(data.src ?? '')
    setEditingUrl(true)
  }

  return (
    <div className="image-node nodrag-caption">
      <Handle type="target" position={Position.Top} className="flow-handle" />
      <Handle type="target" position={Position.Left} id="left" className="flow-handle" />

      {/* Image area */}
      <div
        className={`image-node-img-area${hasImage ? ' has-image' : ''}`}
        onDoubleClick={openUrlEditor}
        title={hasImage ? '双击更换图片' : '双击粘贴图片链接'}
      >
        {hasImage ? (
          <img
            src={data.src}
            alt={data.caption ?? ''}
            className="image-node-img"
            onError={() => setImgError(true)}
            draggable={false}
          />
        ) : (
          <div className="image-node-empty">
            <ImageIcon size={24} className="image-node-empty-icon" />
            <span className="image-node-empty-hint">双击粘贴图片链接</span>
          </div>
        )}

        {/* URL edit overlay */}
        {editingUrl && (
          <div
            className="image-node-url-overlay"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <input
              ref={urlInputRef}
              className="image-node-url-input"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitUrl(urlDraft)
                if (e.key === 'Escape') setEditingUrl(false)
                e.stopPropagation()
              }}
              onBlur={() => commitUrl(urlDraft)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="image-node-caption-area">
        {editingCaption ? (
          <input
            className="image-node-caption-input"
            defaultValue={data.caption ?? ''}
            autoFocus
            placeholder="添加标题..."
            onBlur={(e) => {
              updateNodeData(id, { caption: e.target.value || undefined })
              setEditingCaption(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') setEditingCaption(false)
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className={`image-node-caption${!data.caption ? ' empty' : ''}`}
            onDoubleClick={(e) => { e.stopPropagation(); setEditingCaption(true) }}
            title="双击编辑标题"
          >
            {data.caption || '双击添加标题'}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="flow-handle" />
      <Handle type="source" position={Position.Right} id="right" className="flow-handle" />
    </div>
  )
}

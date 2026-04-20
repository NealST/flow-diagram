import { useState, useCallback, useRef, useEffect } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { parseMermaid } from './mermaidParser'
import { SparkleIcon, AlertIcon, SendIcon, MessageIcon, SettingsIcon, XIcon, LockIcon, RocketIcon, NetworkIcon } from './icons'
import {
  generateFlowFromPrompt,
  loadAIConfig,
  saveAIConfig,
  type AIConfig,
} from './aiService'

type AIChatPanelProps = {
  open: boolean
  onToggle: () => void
  onApply: (nodes: Node[], edges: Edge[]) => void
}

type MessageRole = 'user' | 'assistant' | 'error'
type Message = { role: MessageRole; content: string; timestamp: number }

function detectMode(text: string): 'mermaid' | 'prompt' {
  const trimmed = text.trim()
  if (/^(graph|flowchart)\s/im.test(trimmed)) return 'mermaid'
  if (/-->|---|-\.->|==>/.test(trimmed) && /^[A-Z]/m.test(trimmed)) return 'mermaid'
  return 'prompt'
}

export function AIChatPanel({ open, onToggle, onApply }: AIChatPanelProps) {
  const [tab, setTab] = useState<'chat' | 'settings'>('chat')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '你好！我可以帮你生成流程图。\n\n你可以：\n• 用自然语言描述想要的流程图\n• 直接粘贴 Mermaid 语法\n• 点击下方示例快速体验',
      timestamp: Date.now(),
    },
  ])
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<AIConfig>(loadAIConfig)
  const [configSaved, setConfigSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (open && tab === 'chat' && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [open, tab])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const detectedMode = detectMode(text)

    try {
      if (detectedMode === 'mermaid') {
        const result = parseMermaid(text)
        if (!result) throw new Error('无法解析 Mermaid 语法，请检查格式')
        onApply(result.nodes, result.edges)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `已解析 Mermaid 生成流程图\n\n• ${result.nodes.length} 个节点\n• ${result.edges.length} 条连线`,
            timestamp: Date.now(),
          },
        ])
      } else {
        if (!config.apiKey) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'error',
              content: '请先在「设置」中配置 API Key',
              timestamp: Date.now(),
            },
          ])
          setTab('settings')
          setLoading(false)
          return
        }

        // Add a "thinking" indicator
        const thinkingId = Date.now()
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '思考中...', timestamp: thinkingId },
        ])

        const result = await generateFlowFromPrompt(text, config)
        onApply(result.nodes, result.edges)

        // Replace thinking message with result
        setMessages((prev) =>
          prev.map((m) =>
            m.timestamp === thinkingId
              ? {
                  ...m,
                  content: `已生成流程图\n\n• ${result.nodes.length} 个节点\n• ${result.edges.length} 条连线\n\n你可以继续输入来修改或生成新的流程图。`,
                }
              : m,
          ),
        )
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : '生成失败'
      setMessages((prev) => {
        // Remove thinking message if present
        const filtered = prev.filter(
          (m) => !(m.role === 'assistant' && m.content === '思考中...'),
        )
        return [
          ...filtered,
          { role: 'error', content: errMsg, timestamp: Date.now() },
        ]
      })
    } finally {
      setLoading(false)
    }
  }, [input, loading, config, onApply])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleSaveConfig = useCallback(() => {
    saveAIConfig(config)
    setConfigSaved(true)
    setTimeout(() => setConfigSaved(false), 2000)
  }, [config])

  const EXAMPLES = [
    { label: 'User login', icon: LockIcon, text: '用户登录系统的完整流程，包括输入账号密码、验证、双因素认证、成功/失败处理' },
    { label: 'CI/CD', icon: RocketIcon, text: 'graph LR\n  Code[代码提交] --> Build[构建]\n  Build --> Test[自动测试]\n  Test --> Review[代码审查]\n  Review --> Deploy[部署]\n  Deploy --> Monitor[监控]' },
    { label: 'Microservices', icon: NetworkIcon, text: '一个典型的微服务架构图，包括 API 网关、用户服务、订单服务、支付服务、消息队列、数据库' },
  ]

  if (!open) return null

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-tabs">
          <button
            className={`chat-tab ${tab === 'chat' ? 'active' : ''}`}
            onClick={() => setTab('chat')}
          >
            <MessageIcon size={14} />
            对话
          </button>
          <button
            className={`chat-tab ${tab === 'settings' ? 'active' : ''}`}
            onClick={() => setTab('settings')}
          >
            <SettingsIcon size={14} />
            设置
          </button>
        </div>
        <button className="chat-close-btn" onClick={onToggle} title="关闭">
          <XIcon size={16} />
        </button>
      </div>

      {/* Chat Tab */}
      {tab === 'chat' && (
        <>
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="chat-msg-avatar"><SparkleIcon size={14} /></div>
                )}
                {msg.role === 'error' && (
                  <div className="chat-msg-avatar chat-msg-avatar-error"><AlertIcon size={14} /></div>
                )}
                <div className="chat-msg-bubble">
                  {msg.content.split('\n').map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                  {msg.role === 'assistant' && msg.content === '思考中...' && (
                    <span className="chat-thinking-dots">
                      <span /><span /><span />
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Examples (show when only welcome message) */}
          {messages.length <= 1 && (
            <div className="chat-examples">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  className="chat-example-btn"
                  onClick={() => setInput(ex.text)}
                >
                  <ex.icon size={12} />
                  {ex.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-area">
            <div className="chat-input-wrapper">
              <textarea
                ref={textareaRef}
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述流程图 / 粘贴 Mermaid..."
                rows={2}
                disabled={loading}
              />
              <button
                className="chat-send-btn"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                title="发送 (Enter)"
              >
                {loading ? (
                  <span className="chat-spinner" />
                ) : (
                  <SendIcon size={15} />
                )}
              </button>
            </div>
            <div className="chat-input-hint">
              Enter 发送 · Shift+Enter 换行 · 支持 Mermaid 语法
            </div>
          </div>
        </>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="chat-settings">
          <div className="chat-settings-section">
            <h3>LLM API 配置</h3>
            <p className="chat-settings-desc">
              配置 OpenAI 兼容的 API 接口。支持 OpenAI、DeepSeek、Ollama、vLLM 等。
            </p>
          </div>

          <div className="chat-settings-field">
            <label>API Base URL</label>
            <input
              type="url"
              value={config.baseUrl}
              onChange={(e) => setConfig((c) => ({ ...c, baseUrl: e.target.value }))}
              placeholder="https://api.openai.com/v1"
            />
            <span className="chat-settings-hint">OpenAI 兼容的 API 地址</span>
          </div>

          <div className="chat-settings-field">
            <label>API Key</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
              placeholder="sk-..."
            />
            <span className="chat-settings-hint">不会上传到任何第三方服务器</span>
          </div>

          <div className="chat-settings-field">
            <label>模型名称</label>
            <input
              type="text"
              value={config.model}
              onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))}
              placeholder="gpt-4o-mini"
            />
            <span className="chat-settings-hint">例如 gpt-4o-mini、deepseek-chat</span>
          </div>

          <button className="chat-settings-save" onClick={handleSaveConfig}>
            {configSaved ? 'Saved' : 'Save settings'}
          </button>

          <div className="chat-settings-presets">
            <h4>快速预设</h4>
            <div className="chat-preset-list">
              {[
                { name: 'OpenAI', url: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
                { name: 'DeepSeek', url: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
                { name: 'Ollama (本地)', url: 'http://localhost:11434/v1', model: 'llama3' },
              ].map((preset) => (
                <button
                  key={preset.name}
                  className="chat-preset-btn"
                  onClick={() =>
                    setConfig((c) => ({ ...c, baseUrl: preset.url, model: preset.model }))
                  }
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

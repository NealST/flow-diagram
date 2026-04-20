import { createFileRoute } from '@tanstack/react-router'
import { FlowCanvas } from '#/components/flow/FlowCanvas'
import '#/components/flow/flow-styles.css'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return <FlowCanvas />
}

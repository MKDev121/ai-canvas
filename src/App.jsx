import { useState, useRef } from 'react'
import { Tldraw, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'

export default function App() {
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const editorRef = useRef(null)

  const handleMount = (editor) => {
    editorRef.current = editor
  }

  async function handleGenerate() {
    if (!inputText.trim()) return
    setLoading(true)

    try {
      const response = await fetch('/api/flowchart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      })

      if (!response.ok) throw new Error('Backend failed')

      const data = await response.json()
      
      // Find the JSON content in the files array
      const file = data.files?.find(f => f.content.trim().startsWith('{'))
      if (!file) throw new Error('No JSON data found')

      const instructions = JSON.parse(file.content)
      drawFlowchart(instructions)
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to generate: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const drawFlowchart = ({ nodes, edges }) => {
    const editor = editorRef.current
    if (!editor) return

    // Clear canvas
    const currentIds = Array.from(editor.getCurrentPageShapeIds())
    if (currentIds.length > 0) editor.deleteShapes(currentIds)

    const positionMap = {}
    let x = 100
    let y = 100

    // Draw Nodes
    if (Array.isArray(nodes)) {
      nodes.forEach((node) => {
        const shapeId = createShapeId()
        positionMap[node.id] = { cx: x + 100, cy: y + 30 }

        editor.createShape({
          id: shapeId,
          type: 'geo',
          x,
          y,
          props: {
            geo: 'rectangle',
            w: 200,
            h: 60,
            text: node.label || '',
          },
        })
        y += 150
      })
    }

    // Draw Arrows
    if (Array.isArray(edges)) {
      edges.forEach((edge) => {
        const from = positionMap[edge.source]
        const to = positionMap[edge.target]
        if (from && to) {
          editor.createShape({
            type: 'arrow',
            props: {
              start: { x: from.cx, y: from.cy },
              end: { x: to.cx, y: to.cy },
              text: edge.label || '',
            },
          })
        }
      })
    }
    editor.zoomToFit()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff' }}>
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: 20,
        zIndex: 1000,
        background: 'white',
        padding: '15px',
        borderRadius: '12px',
        width: '300px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        border: '1px solid #ddd'
      }}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="e.g. A user login flow..."
          style={{ width: '100%', height: '80px', marginBottom: '10px', padding: '8px' }}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            background: loading ? '#999' : '#000',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Generating...' : 'Generate Flowchart'}
        </button>
      </div>

      <Tldraw 
        onMount={handleMount} 
        inferDarkMode={false} 
        persistenceKey="ai-canvas-v1" 
      />
    </div>
  )
}

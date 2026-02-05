import { useState, useRef } from 'react'
import { Tldraw, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'

export default function App() {
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const editorRef = useRef(null)

  const handleMount = (editor) => { editorRef.current = editor }

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
      const file = data.files?.find(f => f.content.trim().startsWith('{'))
      if (!file) throw new Error('No JSON data found')
      
      const instructions = JSON.parse(file.content)
      drawFlowchart(instructions)
    } catch (err) {
      console.error('Error:', err)
      alert('Failed: ' + err.message)
    } finally { setLoading(false) }
  }

  const drawFlowchart = ({ nodes, edges }) => {
    const editor = editorRef.current
    if (!editor) return
    
    // Clear canvas
    editor.deleteShapes(Array.from(editor.getCurrentPageShapeIds()))
    
    const positionMap = {}
    let y = 100
    
    if (Array.isArray(nodes)) {
      nodes.forEach((node) => {
        const id = createShapeId()
        positionMap[node.id] = { cx: 200, cy: y + 30 }
        editor.createShape({
          id,
          type: 'geo',
          x: 100,
          y,
          props: { geo: 'rectangle', w: 200, h: 60, text: node.label || '' }
        })
        y += 150
      })
    }

    if (Array.isArray(edges)) {
      edges.forEach((edge) => {
        const from = positionMap[edge.source], to = positionMap[edge.target]
        if (from && to) {
          editor.createShape({
            type: 'arrow',
            props: { start: { x: from.cx, y: from.cy }, end: { x: to.cx, y: to.cy }, text: edge.label || '' }
          })
        }
      })
    }
    editor.zoomToFit()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'white' }}>
      {/* Custom CSS to force visibility and stop Radix crashes */}
      <style>{`
        .tl-container { background-color: white !important; }
        .tl-theme__dark { display: none !important; }
      `}</style>

      <div style={{
        position: 'absolute', bottom: 40, left: 20, zIndex: 1000,
        background: 'white', padding: '15px', borderRadius: '12px',
        width: '300px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #ddd'
      }}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="e.g. User login flow..."
          style={{ width: '100%', height: '80px', marginBottom: '10px', padding: '8px', color: 'black' }}
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            width: '100%', padding: '10px', background: loading ? '#999' : '#000',
            color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer'
          }}
        >
          {loading ? 'Generating...' : 'Generate Flowchart'}
        </button>
      </div>

      <Tldraw 
        onMount={handleMount} 
        inferDarkMode={false} // CRITICAL: Stop the blackout
        persistenceKey="ai-canvas-final" 
      />
    </div>
  )
}

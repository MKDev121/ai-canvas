import { useState, useRef } from 'react'
import { Tldraw, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'

export default function App() {
	const [inputText, setInputText] = useState('')
	const editorRef = useRef(null)

	const handleMount = (editor) => {
		editorRef.current = editor
	}

async function handleGenerate() {
  try {
    const response = await fetch('/api/flowchart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: inputText }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(errText || 'Request failed')
    }

    const data = await response.json()
    console.log('BACKEND DATA:', data)

	const file = data.files?.find(
	f => typeof f.content === 'string' && f.content.trim().startsWith('{')
	)

	if (!file) {
	console.error('FILES RETURNED BY V0:', data.files)
	throw new Error('No JSON file returned from v0')
	}


    let instructions
    try {
      instructions = JSON.parse(file.content)
    } catch (err) {
      console.error('RAW FILE CONTENT:', file.content)
      throw new Error('Failed to parse flowchart JSON')
    }

    // Finally draw the diagram
    drawFlowchart(instructions)

  } catch (err) {
    console.error('Generate flowchart failed:', err)
  }
}

const makeRichText = (text) => {
  if (typeof text !== 'string') return undefined

  const value = text.trim()
  if (!value) return undefined

  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: value }],
      },
    ],
  }
}


const drawFlowchart = ({ nodes, edges }) => {
  const editor = editorRef.current
  if (!editor) return

  const currentIds = Array.from(editor.getCurrentPageShapeIds())
  if (currentIds.length > 0) {
    editor.deleteShapes(currentIds)
  }

  const positionMap = {}
  let x = 100
  let y = 100
  const yGap = 150
  const nodeWidth = 200
  const nodeHeight = 60

  // Draw nodes
  if (Array.isArray(nodes)) {
    nodes.forEach((node) => {
      const shapeId = createShapeId()

      positionMap[node.id] = {
        cx: x + nodeWidth / 2,
        cy: y + nodeHeight / 2,
      }

      const richText = makeRichText(node.label)

      editor.createShape({
        id: shapeId,
        type: 'geo',
        x,
        y,
        props: {
          geo: 'rectangle',
          w: nodeWidth,
          h: nodeHeight,
          fill: 'none',
          ...(richText ? { richText } : {}),
        },
      })

      y += yGap
    })
  }

  // Draw edges
  if (Array.isArray(edges)) {
    edges.forEach((edge) => {
      const from = positionMap[edge.source]
      const to = positionMap[edge.target]
      if (!from || !to) return

      const richText = makeRichText(edge.label)

      editor.createShape({
        type: 'arrow',
        props: {
          start: { x: from.cx, y: from.cy },
          end: { x: to.cx, y: to.cy },
          ...(richText ? { richText } : {}),
        },
      })
    })
  }

  editor.zoomToFit()
}

	return (
		<div style={{ position: 'fixed', inset: 0 }}>
			<div
				style={{
					position: 'absolute',
					bottom: 60,
					left: 16,
					zIndex: 1000,
					background: 'white',
					padding: 12,
					borderRadius: 8,
					width: 320,
					boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
				}}
			>
				<textarea
					value={inputText}
					onChange={(e) => setInputText(e.target.value)}
					placeholder="Describe your process (e.g. Login system)"
					style={{
						width: '100%',
						height: 100,
						resize: 'none',
						marginBottom: 8,
					}}
				/>
				<button
					onClick={handleGenerate}
					style={{
						width: '100%',
						padding: 8,
						cursor: 'pointer',
						background: '#2D2D2D',
						color: 'white',
						border: 'none',
						borderRadius: 4
					}}
				>
					Generate Flowchart
				</button>
			</div>
			<Tldraw onMount={handleMount} persistenceKey="flowchart-ai" />
		</div >
	)
}
'use client'

import { useState, useRef, useEffect } from 'react'
import { Tldraw, createShapeId, Editor } from 'tldraw'
import 'tldraw/tldraw.css'

interface FlowchartNode {
  id: string
  label: string
}

interface FlowchartEdge {
  source: string
  target: string
  label?: string
}

interface FlowchartData {
  nodes: FlowchartNode[]
  edges: FlowchartEdge[]
}

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const editorRef = useRef<Editor | null>(null)

  useEffect(() => {
    console.log('[v0] Page mounted')
    setMounted(true)
  }, [])

  const handleMount = (editor: Editor) => {
    editorRef.current = editor
  }

  const makeRichText = (text: string | undefined) => {
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

  const drawFlowchart = ({ nodes, edges }: FlowchartData) => {
    const editor = editorRef.current
    if (!editor) return

    const currentIds = Array.from(editor.getCurrentPageShapeIds())
    if (currentIds.length > 0) {
      editor.deleteShapes(currentIds)
    }

    const positionMap: Record<string, { cx: number; cy: number }> = {}
    let x = 100
    let y = 100
    const yGap = 150
    const nodeWidth = 200
    const nodeHeight = 60

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

  async function handleGenerate() {
    if (!inputText.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/flowchart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Request failed')
      }

      const data = await response.json()

      const file = data.files?.find(
        (f: { content: string }) => typeof f.content === 'string' && f.content.trim().startsWith('{')
      )

      if (!file) {
        throw new Error('No JSON file returned from v0')
      }

      let instructions: FlowchartData
      try {
        instructions = JSON.parse(file.content)
      } catch {
        throw new Error('Failed to parse flowchart JSON')
      }

      drawFlowchart(instructions)
    } catch (err) {
      console.error('Generate flowchart failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate flowchart')
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading AI Canvas...</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0">
      <div className="absolute bottom-[60px] left-4 z-[1000] bg-white p-3 rounded-lg w-80 shadow-lg">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe your process (e.g. Login system)"
          className="w-full h-24 resize-none mb-2 p-2 border border-gray-200 rounded text-sm text-gray-900"
          disabled={isLoading}
        />
        {error && (
          <p className="text-red-500 text-xs mb-2">{error}</p>
        )}
        <button
          onClick={handleGenerate}
          disabled={isLoading || !inputText.trim()}
          className="w-full p-2 cursor-pointer bg-neutral-800 text-white border-none rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'Generate Flowchart'}
        </button>
      </div>
      <Tldraw onMount={handleMount} persistenceKey="flowchart-ai" />
    </div>
  )
}

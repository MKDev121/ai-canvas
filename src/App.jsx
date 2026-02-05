import { useState, useRef } from 'react'
import { Tldraw, toRichText } from 'tldraw'
import 'tldraw/tldraw.css'

export default function App() {
	const [inputText, setInputText] = useState('')
	const editorRef = useRef(null)

	const handleMount = (editor) => {
		editorRef.current = editor
	}

const handleGenerate = async () => {
	if (!inputText.trim() || !editorRef.current) return

	const response = await fetch('https://api.v0.dev/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${import.meta.env.VITE_V0_API_KEY}`,
		},
		body: JSON.stringify({
			model: 'v0',
			messages: [
				{
					role: 'system',
					content: `You generate flowchart instructions.
Return ONLY valid JSON.
Node types: start, process, decision, end.`,
				},
				{
					role: 'user',
					content: `Convert the following description into a flowchart.

Description:
${inputText}`,
				},
			],
		}),
	})

	const data = await response.json()
	const instructions = JSON.parse(data.choices[0].message.content)
	console.log({ response, data, instructions })
	drawFlowchart(instructions)
}
	const drawFlowchart = ({ nodes, edges }) => {
		const editor = editorRef.current
		editor.deleteShapes(editor.getCurrentPageShapeIds())

		const nodePositions = {}
		let x = 200
		let y = 200
		const yGap = 120

		// 2. Draw nodes
		nodes.forEach((node) => {
			const shapeId = editor.createShape({
				type: 'text',
				x,
				y,
				props: {
					richText: toRichText(node.text),
				},
			})

			nodePositions[node.id] = { x, y }
			y += yGap
		})

		// 3. Draw edges
		edges.forEach((edge) => {
			const from = nodePositions[edge.from]
			const to = nodePositions[edge.to]
			if (!from || !to) return

			editor.createShape({
				type: 'arrow',
				props: {
					start: { x: from.x + 50, y: from.y + 20 },
					end: { x: to.x + 50, y: to.y },
				},
			})
		})

		editor.zoomToFit()
	}

	return (
		<div style={{ position: 'fixed', inset: 0 }}>
			<div
				style={{
					position: 'absolute',
					top: 16,
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
					placeholder="Describe your process or system..."
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
					}}
				>
					Generate Flowchart
				</button>
			</div>

			<Tldraw onMount={handleMount} persistenceKey="flowchart-ai" />
		</div>
	)
}
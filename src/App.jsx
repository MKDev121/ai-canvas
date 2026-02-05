import { useState, useRef } from 'react'
import { Tldraw, createShapeId } from 'tldraw'
import 'tldraw/tldraw.css'

export default function App() {
	const [inputText, setInputText] = useState('')
	const editorRef = useRef(null)

	const handleMount = (editor) => {
		editorRef.current = editor
	}

	const handleGenerate = async () => {
		if (!inputText.trim() || !editorRef.current) return

		try {
			console.log("Attempting to fetch from API...")

			// --- FIX 1: URL FORMATTING ---
			// Ensure this URL is a clean string without brackets []
			const response = await fetch('https://api.v0.dev/v1/chat/completions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					// Make sure your .env file has VITE_V0_API_KEY defined!
					Authorization: `Bearer ${import.meta.env.VITE_V0_API_KEY}`,
				},
				body: JSON.stringify({
					model: 'v0',
					messages: [
						{
							role: 'system',
							content: `You are an expert Flowchart Architect. 
                            CRITICAL RULES:
                            1. Return ONLY valid JSON.
                            2. Do NOT use Markdown code blocks (no \`\`\`).
                            3. Use this schema:
                            {
                                "nodes": [{ "id": "1", "label": "Start", "type": "process" }],
                                "edges": [{ "source": "1", "target": "2", "label": "next" }]
                            }`,
						},
						{
							role: 'user',
							content: `Create a flowchart for: ${inputText}`,
						},
					],
				}),
			})

			// --- FIX 2: HANDLE 404/500 ERRORS ---
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`API Failed (${response.status}): ${errorText}`);
			}

			// --- FIX 3: SAFE JSON PARSING ---
			// We get text first to safely clean it before parsing
			const rawText = await response.text()
			console.log("Raw API Response:", rawText) // Check console to see what we got

			// Remove markdown code blocks (```json ... ```) if the AI added them
			const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim()

			const apiResponse = JSON.parse(cleanText)

			// Extract the content. If content is a stringified JSON, parse it again.
			let content = apiResponse.choices[0].message.content
			if (typeof content === 'string') {
				content = content.replace(/```json/g, '').replace(/```/g, '').trim()
				// Sometimes the AI returns the JSON inside the content string
				try {
					content = JSON.parse(content)
				} catch (e) {
					// If it's not JSON string, use it as is (rare case)
				}
			}

			drawFlowchart(content)

		} catch (e) {
			console.error("Full Error Details:", e)
			alert(`Error: ${e.message}. Check the Console for details.`)
		}
	}

	const drawFlowchart = ({ nodes, edges }) => {
		const editor = editorRef.current
		if (!editor) return

		// --- FIX 4: FIX deleteShapes ERROR ---
		// Convert the Set to an Array before passing to deleteShapes
		const currentIds = Array.from(editor.getCurrentPageShapeIds())
		if (currentIds.length > 0) {
			editor.deleteShapes(currentIds)
		}

		const idMap = {}
		let x = 100
		let y = 100
		const yGap = 150

		// Draw Nodes
		if (nodes && Array.isArray(nodes)) {
			nodes.forEach((node) => {
				const shapeId = createShapeId()
				idMap[node.id] = shapeId

				editor.createShape({
					id: shapeId,
					type: 'geo',
					x: x,
					y: y,
					props: {
						geo: 'rectangle',
						text: node.label,
						w: 200,
						h: 60,
						fill: 'none'
					},
				})
				y += yGap
			})
		}

		// Draw Edges
		if (edges && Array.isArray(edges)) {
			edges.forEach((edge) => {
				const sourceId = idMap[edge.source]
				const targetId = idMap[edge.target]

				if (sourceId && targetId) {
					editor.createShape({
						type: 'arrow',
						props: {
							start: { type: 'binding', boundShapeId: sourceId, normalizedAnchor: { x: 0.5, y: 0.5 } },
							end: { type: 'binding', boundShapeId: targetId, normalizedAnchor: { x: 0.5, y: 0.5 } },
							text: edge.label || '',
						},
					})
				}
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
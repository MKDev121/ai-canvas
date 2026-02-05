import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    const apiKey = process.env.V0_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'V0_API_KEY not configured' }, { status: 500 })
    }

    const response = await fetch('https://api.v0.dev/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        message: `
Create exactly ONE file named "flowchart.json".

The file content MUST be valid JSON.
Do NOT include markdown.
Do NOT include explanations.
Do NOT include backticks.

The JSON schema MUST be exactly:

{
  "nodes": [
    { "id": "string", "label": "string" }
  ],
  "edges": [
    { "source": "string", "target": "string", "label": "string" }
  ]
}

Description:
${text}
`
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('V0 API error:', errorText)
      return NextResponse.json({ error: 'Failed to generate flowchart' }, { status: 500 })
    }

    const data = await response.json()
    
    const files = data.latestVersion?.files ?? data.files ?? []
    
    if (!files.length) {
      return NextResponse.json({ error: 'No files returned from v0' }, { status: 500 })
    }

    return NextResponse.json({ files })
  } catch (err) {
    console.error('FLOWCHART ERROR:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

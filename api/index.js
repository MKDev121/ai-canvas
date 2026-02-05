import express from 'express'
import { v0 } from 'v0-sdk'
import 'dotenv/config'

const app = express()
app.use(express.json())

app.post('/api/flowchart', async (req, res) => {
  try {
    const { text } = req.body

const chat = await v0.chats.create({
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
})


    if (!chat?.files?.length) {
      return res.status(500).json({ error: 'No files returned from v0' })
    }

    res.json({
  files: chat.latestVersion?.files ?? []
})


  } catch (err) {
    console.error('FLOWCHART ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

app.listen(3001, () => {
	console.log('API running on http://localhost:3001')
})

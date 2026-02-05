import express from 'express'
import { v0 } from 'v0-sdk'
import 'dotenv/config'

const app = express()
app.use(express.json())

// Health check to verify backend is alive
app.get('/api/health', (req, res) => res.send('Backend OK'));

app.post('/api/flowchart', async (req, res) => {
  try {
    const { text } = req.body

    // IMPORTANT: v0 SDK might take > 10s. 
    // If this times out, you will see a 504 error in Vercel.
    const chat = await v0.chats.create({
      message: `
        Create exactly ONE file named "flowchart.json".
        The file content MUST be valid JSON. Do NOT include markdown.
        JSON schema: { "nodes": [{ "id": "s", "label": "s" }], "edges": [{ "source": "s", "target": "s" }] }
        Description: ${text}
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

// FIX: Do NOT use app.listen(3001). 
// This causes the "Blackout" because Vercel doesn't allow long-running processes.
export default app; 

import express from 'express'
import { v0 } from 'v0-sdk'
import 'dotenv/config'

const app = express()
app.use(express.json())

app.post('/api/flowchart', async (req, res) => {
  try {
    const { text } = req.body
    if (!text) return res.status(400).json({ error: 'No text provided' })

    const chat = await v0.chats.create({
      message: `Create exactly ONE file named "flowchart.json". The file content MUST be valid JSON. Do NOT include markdown. 
      Schema: { "nodes": [{ "id": "1", "label": "Start" }], "edges": [] }
      Description: ${text}`
    })

    if (!chat?.latestVersion?.files?.length) {
      return res.status(500).json({ error: 'No files returned from AI' })
    }

    res.json({
      files: chat.latestVersion.files
    })

  } catch (err) {
    console.error('SERVER ERROR:', err)
    res.status(500).json({ error: err.message })
  }
})

// Vercel requirement: Export the app, don't use app.listen
export default app;

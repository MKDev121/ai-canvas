import express from 'express'
import { v0 } from 'v0-sdk'
import 'dotenv/config'
const app = express()
app.use(express.json())
app.post('/api/flowchart', async (req, res) => {
  try {
    const chat = await v0.chats.create({ message: `Create ONE file "flowchart.json". JSON only. Schema: { "nodes": [{"id":"1","label":"start"}], "edges": [] }. Content: ${req.body.text}` })
    res.json({ files: chat.latestVersion?.files ?? [] })
  } catch (err) { res.status(500).json({ error: err.message }) }
})
export default app;

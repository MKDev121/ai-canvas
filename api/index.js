export const maxDuration = 60;
import express from 'express';
import { v0 } from 'v0-sdk';
import 'dotenv/config';

const app = express();
app.use(express.json());

app.post('/api/flowchart', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    console.log('Sending to v0...');
    const chat = await v0.chats.create({
      message: `Create ONE file "flowchart.json". JSON only. Schema: { "nodes": [{"id":"1","label":"start"}], "edges": [] }. Content: ${text}`
    });

    // SAFE CHECK: Navigate the object carefully to avoid "Cannot read property of undefined"
    const files = chat?.latestVersion?.files || chat?.files || [];
    
    if (files.length === 0) {
      console.error('v0 returned no files');
      return res.status(500).json({ error: 'AI failed to generate a file' });
    }

    res.json({ files });

  } catch (err) {
    console.error('CRASH ERROR:', err.message);
    // Send the actual error back to the frontend alert so you can see it
    res.status(500).json({ error: `Backend crash: ${err.message}` });
  }
});

export default app;

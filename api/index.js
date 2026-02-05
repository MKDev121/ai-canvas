export const maxDuration = 60; // Force 60s timeout
import express from 'express';
import { v0 } from 'v0-sdk';
import 'dotenv/config';

const app = express();
app.use(express.json());

// 1. Health Check: Visit /api/health in your browser to see if backend is even alive
app.get('/api/health', (req, res) => res.send('Backend is ALIVE!'));

app.post('/api/flowchart', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    // 2. Critical: Check if the API key is actually there
    if (!process.env.V0_API_KEY) {
      throw new Error('V0_API_KEY is missing from Vercel Environment Variables');
    }

    const chat = await v0.chats.create({
      message: `Create exactly ONE file named "flowchart.json". JSON only. No markdown. 
      Schema: { "nodes": [{"id":"1","label":"Start"}], "edges": [] }. 
      Description: ${text}`
    });

    // 3. Safe check for the nested file data
    const files = chat?.latestVersion?.files || chat?.files || [];
    if (!files.length) throw new Error('AI returned no data');

    res.json({ files });
  } catch (err) {
    console.error('BACKEND CRASH:', err.message);
    // Send the REAL error back to the alert so you can see it
    res.status(500).json({ error: err.message });
  }
});

export default app;

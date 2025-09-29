import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/excuse', async (req, res) => {
  try {
    const { subject='class', tone='casual' } = req.body;
    const prompt = `You are a concise assistant. Write a short, believable excuse (<= 50 words) for missing a ${subject} class. Tone: ${tone}.`;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if(!OPENAI_API_KEY) return res.status(500).json({ error: 'OpenAI key not configured' });

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + OPENAI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 120,
        temperature: 0.8
      })
    });
    if(!r.ok) {
      const txt = await r.text();
      return res.status(r.status).send(txt);
    }
    const data = await r.json();
    const text = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content.trim() : '';
    res.json({ excuse: text });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log('Backend listening on', port));

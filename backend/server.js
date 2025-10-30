import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

// Initialize dotenv to load environment variables (like GEMINI_API_KEY)
dotenv.config();

// Fix __dirname and __filename for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); 
// __dirname now points to the 'backend' folder

const app = express();

// --- MIDDLEWARE ---
app.use(cors()); // Enable CORS for development/local testing
app.use(express.json()); // Middleware to parse JSON body from frontend requests

// --- 1. API ROUTES (Must come before static file serving) ---
app.post('/api/gemini-excuse', async (req, res) => {
    console.log('Received request for /api/gemini-excuse');
    try {
        const { subject = 'class', tone = 'casual' } = req.body;
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        const MODEL_NAME = 'gemini-2.5-flash';
        
        // Key validation
        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not configured in .env file.');
            return res.status(500).json({ error: 'Gemini API key not configured' });
        }

        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            // System instruction to guide the model's output
            contents: `You are a concise assistant. Write a short, believable excuse (<= 50 words) for missing a ${subject} class. Tone: ${tone}.`,
        });

        const result = {
            model: MODEL_NAME,
            excuse: response.text.trim()
        };
        
        console.log('Gemini API success:', result);
        res.json(result);

    } catch (err) {
        console.error('Gemini API Error:', err.message);
        res.status(500).json({ error: 'Failed to generate excuse from Gemini API.' });
    }
});

// --- 2. STATIC FILE SERVING (Must come after API routes) ---
// Serve files from the 'public' folder, which is one directory up from 'backend'
const PUBLIC_PATH = path.join(__dirname, '..', 'public'); 
app.use(express.static(PUBLIC_PATH));

// --- 3. START SERVER ---
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n\n✅ Server is running on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT}/chatbot.html in your browser.`);
});

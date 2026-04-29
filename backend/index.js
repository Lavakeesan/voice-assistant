import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI Client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// API Route for chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Convert history from Gemini format to OpenAI format
        const messages = [
            { role: "system", content: "You are a helpful and modern AI assistant." },
            ...(history || []).map(h => ({
                role: h.role === "model" ? "assistant" : "user",
                content: h.parts[0].text
            })),
            { role: "user", content: message }
        ];

        // Using GPT-4o for the best performance
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
        });

        res.json({ text: completion.choices[0].message.content });
    } catch (error) {
        console.error("OpenAI API Error:", error.message);
        res.status(500).json({ 
            error: "Failed to fetch response from OpenAI",
            details: error.message 
        });
    }
});

// Basic health check
app.get('/', (req, res) => {
    res.send('Chatbot Backend (OpenAI) is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

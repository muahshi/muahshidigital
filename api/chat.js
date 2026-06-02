/**
 * Vercel Serverless Function
 * Handles Groq LLM & Telegram Notifications with smart classification
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    const { messages, type, query } = req.body;
    
    // Config from Vercel ENV
    const GROQ_KEY = process.env.GROQ_API_KEY;
    const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TG_CHAT = process.env.TELEGRAM_CHAT_ID;

    // 1. Handle Telegram (Leads Notification Only)
    if (type === 'notification') {
        try {
            const msg = `⚡ *New Portfolio Lead*\n\n🗨️ *Message/Query:* ${query}\n\n📍 _Source: Muahshi Digital Portfolio_`;
            await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TG_CHAT, text: msg, parse_mode: 'Markdown' })
            });
            return res.status(200).json({ success: true });
        } catch (e) { 
            return res.status(500).json({ error: 'Telegram Notification Failed' }); 
        }
    }

    // 2. Handle Natural AI Chat (Groq Llama 3.3)
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `Aap Mubashir Hasan ke premium personal AI Assistant hain.
                        Personality: Technical, Elite Business Consultant, Strategic MBA graduate.
                        Tone: Natural Hinglish (Hindi + English mix). Always premium and helpful.
                        Expertise: 
                        - Amazon FBA scaling (USA/International logistics, automated replenishment pipelines).
                        - AI Automations (creating complex n8n custom logic, python APIs, and multi-agent systems).
                        - High-volume data operations (New Life Laboratories experience managing 10,000+ files with Excel/Sheets formulas). Excellent candidate for Bhopal Metro systems/data executive roles.
                        
                        CRITICAL INSTRUCTION: Converse naturally. Talk about budgets, pricing, websites, chatbots, and technical stacks like a consultant. Do NOT append "The message has been sent to Mubashir" or mention notifications. Let the client-side system handle lead confirmation messages. Keep replies concise and professional (max 2-3 sentences).`
                    },
                    ...messages
                ],
                temperature: 0.65,
                max_tokens: 300
            }),
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'AI Processing Error' });
    }
}
/**
 * Vercel Serverless Function
 * Handles Groq LLM & Telegram Notifications
 */

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

    const { messages, type, query } = req.body;
    
    // Config from Vercel ENV
    const GROQ_KEY = process.env.GROQ_API_KEY;
    const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TG_CHAT = process.env.TELEGRAM_CHAT_ID;

    // 1. Handle Telegram (Leads)
    if (type === 'notification') {
        try {
            const msg = `⚡ *New AI Lead*\n\n🗨️ *Message:* ${query}\n\n📍 _Source: Muahshi Digital Portfolio_`;
            await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TG_CHAT, text: msg, parse_mode: 'Markdown' })
            });
            return res.status(200).json({ success: true });
        } catch (e) { return res.status(500).end(); }
    }

    // 2. Handle AI Chat (Groq)
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
                        content: `Aap Mubashir Hasan ke AI Assistant hain. 
                        Personality: Premium, Technical, Strategic. 
                        Tone: Hinglish (Hindi + English). 
                        Expertise: Amazon FBA (USA/International), AI Automation (n8n, Python), Custom Dashboards. 
                        Location: Bhopal based architect. 
                        Conversion: Agar koi kaam ki baat kare toh bolna "The message has been sent to Mubashir". 
                        Keep it concise (max 2 sentences).`
                    },
                    ...messages
                ],
                temperature: 0.6,
                max_tokens: 300
            }),
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'AI Error' });
    }
}
/**
 * Muahshi Digital - Premium Interactive Personal AI Assistant
 * Designed to work with Vercel serverless Groq `/api/chat` function.
 * Perfectly calibrated with both manual and premium index DOM mappings.
 */

class MuahshiAssistant {
    constructor() {
        this.history = [];
        this.isListening = false;
        this.synth = window.speechSynthesis;
        this.recognition = null;
        this.init();
    }

    init() {
        this.setupSpeechRecognition();
        this.bindEvents();
        this.renderSuggestionPills();
    }

    setupSpeechRecognition() {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (Speech) {
            this.recognition = new Speech();
            this.recognition.lang = 'hi-IN';
            this.recognition.onresult = (e) => this.handleInput(e.results[0][0].transcript);
            this.recognition.onend = () => {
                this.isListening = false;
                const voiceTrigger = document.getElementById('voice-trigger') || document.getElementById('voiceBtn');
                if (voiceTrigger) {
                    voiceTrigger.classList.remove('text-red-500', 'animate-pulse');
                    const voiceIcon = document.getElementById('voiceIcon');
                    if (voiceIcon) voiceIcon.className = "fas fa-microphone";
                }
            };
        }
    }

    // Dynamic suggested queries pitching Mubashir's expertise 
    getSuggestions() {
        return [
            { label: "Bhopal Metro Job Pitch 🚇", text: "Bhopal Metro ke systems/data role ke liye Mubashir ideal candidate kyun hain?" },
            { label: "AI & n8n Skills ⚡", text: "Mubashir ne n8n aur AI automations me kya systems build kiye hain?" },
            { label: "Amazon FBA Scale 📦", text: "Amazon USA Operations aur logistics me Mubashir ki kya expertise hai?" },
            { label: "Mubashir Se Connect Karein 📲", text: "Mubashir se contact kaise karein aur unka response rate kya hai?" }
        ];
    }

    // Render suggestion chips inside chat stream on load
    renderSuggestionPills() {
        const stream = document.getElementById('chat-messages') || document.getElementById('chatStream');
        if (!stream) return;

        const pillsContainer = document.createElement('div');
        pillsContainer.id = "suggestion-pills-container";
        pillsContainer.className = "flex flex-wrap gap-2 pt-3 justify-start";

        this.getSuggestions().forEach(sug => {
            const pill = document.createElement('button');
            pill.className = "bg-white/[0.03] hover:bg-[#C9A84C]/10 border border-white/5 hover:border-[#C9A84C]/40 text-[#A1A1A0] hover:text-white text-[10px] px-3 py-1.5 rounded-full transition duration-300 font-medium text-left";
            pill.innerText = sug.label;
            pill.onclick = (e) => {
                e.stopPropagation();
                this.handleInput(sug.text);
            };
            pillsContainer.appendChild(pill);
        });

        stream.appendChild(pillsContainer);
        stream.scrollTop = stream.scrollHeight;
    }

    bindEvents() {
        const trigger = document.getElementById('ai-trigger') || document.getElementById('aiChatWrapper');
        const box = document.getElementById('ai-chat-box') || document.getElementById('aiChatBox');
        const close = document.getElementById('close-chat') || document.querySelector('#aiChatBox button');
        const send = document.getElementById('send-btn') || document.querySelector('#aiChatBox button[onclick="sendChatMessage()"]');
        const input = document.getElementById('chat-input') || document.getElementById('chatInput');
        const voice = document.getElementById('voice-trigger') || document.getElementById('voiceBtn');

        // Toggle handling
        if (trigger) {
            trigger.onclick = (e) => {
                e.stopPropagation();
                const icon = document.getElementById('ai-main-icon') || document.getElementById('chatTriggerIcon');
                if (box.style.display === 'none' || box.style.display === '' || box.classList.contains('hidden')) {
                    box.style.display = 'flex';
                    box.classList.remove('hidden');
                    if (icon) icon.className = 'fas fa-chevron-down';
                    
                    const msgs = document.getElementById('chat-messages') || document.getElementById('chatStream');
                    if (msgs) msgs.scrollTop = msgs.scrollHeight;
                } else {
                    box.style.display = 'none';
                    box.classList.add('hidden');
                    if (icon) icon.className = 'fas fa-comment-dots';
                }
            };
        }

        // Close button
        if (close) {
            close.onclick = (e) => {
                e.stopPropagation();
                box.style.display = 'none';
                box.classList.add('hidden');
                const icon = document.getElementById('ai-main-icon') || document.getElementById('chatTriggerIcon');
                if (icon) icon.className = 'fas fa-comment-dots';
            };
        }

        if (send) {
            send.onclick = () => this.handleInput(input.value);
        }

        if (input) {
            input.onkeypress = (e) => { 
                if (e.key === 'Enter') this.handleInput(input.value); 
            };
        }

        if (voice) {
            voice.onclick = () => {
                if (!this.recognition) {
                    this.appendMessage('ai', "Voice recognition is browser mein supported nahi hai.");
                    return;
                }
                if (this.isListening) {
                    this.recognition.stop();
                } else {
                    this.recognition.start();
                    this.isListening = true;
                    voice.classList.add('text-red-500', 'animate-pulse');
                    const voiceIcon = document.getElementById('voiceIcon');
                    if (voiceIcon) voiceIcon.className = "fas fa-spinner animate-spin text-[#C9A84C]";
                }
            };
        }
    }

    async handleInput(text) {
        if (!text.trim()) return;
        
        const inputField = document.getElementById('chat-input') || document.getElementById('chatInput');
        if (inputField) inputField.value = '';
        this.appendMessage('user', text);

        const typingId = this.appendMessage('ai', 'Thinking...');

        try {
            // Attempt serverless API Groq call
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: [
                        {
                            role: "system",
                            content: `Aap Mubashir Hasan ke premium strategic AI Assistant hain. 
                            Personality: High-end, technical, strategic MBA mindset. 
                            Tone: Professional Hinglish. 
                            Core Mission: Convert readers into leads. Always pitch Mubashir's work.
                            Details:
                            - 5 years data management at New Life Labs (processed 10,000+ laboratory files). Perfect candidate for Bhopal Metro systems or operational documentation roles due to flawless Excel & speed.
                            - Built 150+ custom operational automations via n8n and API logic.
                            - Handles active Amazon USA operations since 2022 (replenishment algorithms, dynamic profit calculations).
                            - WhatsApp directly at +91 9575877758.
                            Keep replies within 2-3 concise, high-converting sentences.`
                        },
                        ...this.history, 
                        { role: 'user', content: text }
                    ] 
                })
            });

            if (!res.ok) throw new Error("API call error");

            const data = await res.json();
            const reply = data.choices[0].message.content;

            const typingElem = document.getElementById(typingId);
            if (typingElem) typingElem.remove();

            this.appendMessage('ai', reply);
            this.speak(reply);
            
            this.history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });

            // Send Lead Alerts to Telegram
            if (reply.includes('message has been sent') || text.toLowerCase().includes('connect') || text.toLowerCase().includes('contact') || text.toLowerCase().includes('hire')) {
                this.sendNotification(text);
            }

        } catch (e) {
            // Instant Client-Side fallback matching user custom logic
            const typingElem = document.getElementById(typingId);
            if (typingElem) typingElem.remove();

            const reply = this.getFallbackReply(text);
            this.appendMessage('ai', reply);
            this.speak(reply);
            
            this.history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });
        }
    }

    getFallbackReply(input) {
        const query = input.toLowerCase().trim();
        
        if (query.includes('hi') || query.includes('hello') || query.includes('assalam') || query.includes('hey')) {
            return "Assalam-o-Alaikum! Main Mubashir ka AI systems assistant hoon. Main aapke business automations, system strategy, ya Amazon FBA queries me kaise madad kar sakta hoon?";
        }
        if (query.includes('metro') || query.includes('bhopal') || query.includes('data entry') || query.includes('operator')) {
            return "Bhopal MP Metro me Data Entry/Systems role ke liye Mubashir ekdam ideal candidate hain. Unke paas New Life Laboratories me 5 saal (2017-2022) tak 10,000+ records ko securely manage karne ka strong experience hai. Unhe high-speed verification aur flawless spreadsheets handle karne me mastery hai.";
        }
        if (query.includes('amazon') || query.includes('fba') || query.includes('usa')) {
            return "Mubashir 2022 se Amazon USA operations handle kar rahe hain. Inventory tracking, shipping codes management aur profitability analytics spreadsheets unke main expertise areas hain.";
        }
        if (query.includes('n8n') || query.includes('automation') || query.includes('agent')) {
            return "n8n automation aur custom LLM integrations ka use karke Mubashir ne 150+ robust workflow logics and automated agents build kiye hain. Details ke liye aap agents.html check kar sakte hain.";
        }
        if (query.includes('contact') || query.includes('number') || query.includes('phone') || query.includes('email') || query.includes('connect')) {
            return "Aap Mubashir se directly +91 9575877758 par WhatsApp ya muahshi.dev@gmail.com par connect kar sakte hain. Unka professional response rate kaafi fast hai.";
        }
        
        return "Mubashir Hasan ek expert AI Automation & Systems Architect hain. Unki professional automation systems aur case studies ki details portfolio dashboard par live hain. Direct contact ke liye aap +91 9575877758 ka use kar sakte hain.";
    }

    appendMessage(role, text) {
        const container = document.getElementById('chat-messages') || document.getElementById('chatStream');
        if (!container) return;
        
        const id = 'msg-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        
        if (role === 'user') {
            div.className = "bg-[#C9A84C]/15 border border-[#C9A84C]/30 text-white p-3.5 rounded-xl ml-auto max-w-[85%] text-right self-end block text-xs";
        } else {
            div.className = "bg-white/[0.03] border border-white/5 text-gray-300 p-3.5 rounded-xl mr-auto max-w-[85%] text-left self-start block text-xs leading-relaxed";
        }
        div.innerText = text;
        
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return id;
    }

    speak(text) {
        if (!this.synth) return;
        this.synth.cancel();
        const cleanText = text.replace(/<\/?[^>]+(>|$)/g, "");
        const ut = new SpeechSynthesisUtterance(cleanText);
        ut.lang = 'hi-IN';
        ut.rate = 1.05;
        this.synth.speak(ut);
    }

    async sendNotification(query) {
        try {
            await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'notification', query: query })
            });
        } catch(e) {}
    }
}

// Instantiate on boot
document.addEventListener('DOMContentLoaded', () => {
    window.assistant = new MuahshiAssistant();
});
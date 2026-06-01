/**
 * Muahshi Digital - Personal AI Assistant
 * Optimized for Premium Dark/Gold Theme with bulletproof Static Fallback
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
    }

    setupSpeechRecognition() {
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (Speech) {
            this.recognition = new Speech();
            this.recognition.lang = 'hi-IN';
            this.recognition.onresult = (e) => this.handleInput(e.results[0][0].transcript);
            this.recognition.onend = () => {
                this.isListening = false;
                document.getElementById('voice-trigger').classList.remove('text-red-500', 'animate-pulse');
            };
        }
    }

    bindEvents() {
        const trigger = document.getElementById('ai-trigger');
        const box = document.getElementById('ai-chat-box');
        const close = document.getElementById('close-chat');
        const send = document.getElementById('send-btn');
        const input = document.getElementById('chat-input');
        const voice = document.getElementById('voice-trigger');

        // Toggle Open/Close using tailwind class switching (Prevents CSS conflicts)
        trigger.onclick = () => {
            const isClosed = box.classList.contains('hidden');
            if (isClosed) {
                box.classList.remove('hidden');
                box.classList.add('flex');
                trigger.querySelector('i').className = 'fas fa-chevron-down';
            } else {
                box.classList.add('hidden');
                box.classList.remove('flex');
                trigger.querySelector('i').className = 'fas fa-comment-dots';
            }
        };

        // Explicit Close handler (Fixes "Not closing" bug)
        close.onclick = () => {
            box.classList.add('hidden');
            box.classList.remove('flex');
            trigger.querySelector('i').className = 'fas fa-comment-dots';
        };

        send.onclick = () => this.handleInput(input.value);
        input.onkeypress = (e) => { if (e.key === 'Enter') this.handleInput(input.value); };

        voice.onclick = () => {
            if (!this.recognition) return alert("Browser voice support missing.");
            if (this.isListening) {
                this.recognition.stop();
            } else {
                this.recognition.start();
                this.isListening = true;
                voice.classList.add('text-red-500', 'animate-pulse');
            }
        };
    }

    async handleInput(text) {
        if (!text.trim()) return;
        
        const inputField = document.getElementById('chat-input');
        inputField.value = '';
        this.appendMessage('user', text);

        const typingId = this.appendMessage('ai', 'Thinking...');

        try {
            // Serverless connection attempt
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: [...this.history, { role: 'user', content: text }] 
                })
            });

            if (!res.ok) throw new Error("Static platform fallback triggered.");

            const data = await res.json();
            const reply = data.choices[0].message.content;

            document.getElementById(typingId).remove();
            this.appendMessage('ai', reply);
            this.speak(reply);
            
            this.history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });

            if (reply.includes('Mubashir tak pahuch jayega') || text.toLowerCase().includes('connect') || text.toLowerCase().includes('contact')) {
                this.sendNotification(text);
            }

        } catch (e) {
            // Local AI Smart Engine (Ensures beautiful replies on static platforms like GitHub Pages!)
            document.getElementById(typingId).remove();
            const reply = this.getFallbackReply(text);
            this.appendMessage('ai', reply);
            this.speak(reply);
        }
    }

    // High-fidelity Local Reply Parser for static deployment
    getFallbackReply(input) {
        const query = input.toLowerCase();
        
        if (query.includes('hi') || query.includes('hello') || query.includes('assalam')) {
            return "Assalam-o-Alaikum! Main Mubashir ka Assistant hoon. Main aapke business and system workflow automations mein kaise help kar sakta hoon?";
        }
        if (query.includes('metro') || query.includes('bhopal') || query.includes('data entry')) {
            return "MP Metro Data Entry aur admin systems handle karne ke liye Mubashir ka profile completely fit hai. Unke paas New Life Labs mein 5 saal se zyada spreadsheets ka solid experience hai.";
        }
        if (query.includes('amazon') || query.includes('fba') || query.includes('reselling')) {
            return "Mubashir 2022 se Amazon USA reselling aur FBA systems manage kar rahe hain. Inventory logging aur automatic profitability sheets unka strong side hain.";
        }
        if (query.includes('n8n') || query.includes('agent') || query.includes('automation')) {
            return "Mubashir ne n8n and advanced LLMs (OpenAI/Claude) ke tools se 150+ robust automation workflows deploy kiye hain jo processes ko flawless banate hain.";
        }
        if (query.includes('contact') || query.includes('number') || query.includes('phone') || query.includes('email')) {
            return "Aap Mubashir se +91 9575877758 par WhatsApp ya muahshi.dev@gmail.com par connect kar sakte hain. Custom setups ke liye unka response rate fast hai.";
        }
        
        return "Mubashir ke custom SaaS frameworks aur automation standards ko aap upar selection aur dynamic agents hub mein dekh sakte hain. Direct dynamic connection ke liye WhatsApp button use karein!";
    }

    appendMessage(role, text) {
        const container = document.getElementById('chat-messages');
        const id = 'msg-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = role === 'user' ? 'user-msg p-4 text-[13px] ml-auto max-w-[85%] text-white' : 'ai-msg p-4 text-[13px] mr-auto max-w-[85%] text-gray-300';
        div.innerText = text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return id;
    }

    speak(text) {
        if (!this.synth) return;
        this.synth.cancel();
        const ut = new SpeechSynthesisUtterance(text);
        ut.lang = 'hi-IN';
        ut.rate = 1.1;
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

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    window.assistant = new MuahshiAssistant();
});
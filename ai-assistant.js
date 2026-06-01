/**
 * Muahshi Digital - Personal AI Assistant Logic
 * Fully optimized for click responsiveness, showing/hiding on trigger, and seamless static fallback
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
                const voiceTrigger = document.getElementById('voice-trigger');
                if (voiceTrigger) {
                    voiceTrigger.classList.remove('text-red-500', 'animate-pulse');
                }
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

        // Robust Toggle using style.display to completely bypass Tailwind conflicts
        trigger.onclick = (e) => {
            e.stopPropagation();
            const icon = document.getElementById('ai-main-icon');
            if (box.style.display === 'none' || box.style.display === '') {
                box.style.display = 'flex';
                icon.className = 'fas fa-chevron-down';
                // Auto Scroll down
                const msgs = document.getElementById('chat-messages');
                if (msgs) msgs.scrollTop = msgs.scrollHeight;
            } else {
                box.style.display = 'none';
                icon.className = 'fas fa-comment-dots';
            }
        };

        // Close button click handler
        close.onclick = (e) => {
            e.stopPropagation();
            box.style.display = 'none';
            const icon = document.getElementById('ai-main-icon');
            if (icon) icon.className = 'fas fa-comment-dots';
        };

        send.onclick = () => this.handleInput(input.value);
        input.onkeypress = (e) => { 
            if (e.key === 'Enter') this.handleInput(input.value); 
        };

        if (voice) {
            voice.onclick = () => {
                if (!this.recognition) {
                    this.appendMessage('ai', "Voice recognition aapke browser mein supported nahi hai.");
                    return;
                }
                if (this.isListening) {
                    this.recognition.stop();
                } else {
                    this.recognition.start();
                    this.isListening = true;
                    voice.classList.add('text-red-500', 'animate-pulse');
                }
            };
        }
    }

    async handleInput(text) {
        if (!text.trim()) return;
        
        const inputField = document.getElementById('chat-input');
        inputField.value = '';
        this.appendMessage('user', text);

        const typingId = this.appendMessage('ai', 'Thinking...');

        try {
            // Attempt to hit serverless endpoint
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: [...this.history, { role: 'user', content: text }] 
                })
            });

            if (!res.ok) throw new Error("Fallback to static parser needed.");

            const data = await res.json();
            const reply = data.choices[0].message.content;

            const typingElem = document.getElementById(typingId);
            if (typingElem) typingElem.remove();

            this.appendMessage('ai', reply);
            this.speak(reply);
            
            this.history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });

            if (reply.includes('Mubashir tak pahuch') || text.toLowerCase().includes('connect') || text.toLowerCase().includes('contact')) {
                this.sendNotification(text);
            }

        } catch (e) {
            // Instant Client-Side AI Response (No waiting loops!)
            const typingElem = document.getElementById(typingId);
            if (typingElem) typingElem.remove();

            const reply = this.getFallbackReply(text);
            this.appendMessage('ai', reply);
            this.speak(reply);
            
            this.history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });
        }
    }

    // High fidelity conversational Hinglish response bank for fast interaction
    getFallbackReply(input) {
        const query = input.toLowerCase().trim();
        
        if (query.includes('hi') || query.includes('hello') || query.includes('assalam') || query.includes('hey')) {
            return "Assalam-o-Alaikum! Main Mubashir Hasan ka personal AI Assistant hoon. Main aapke business automations, system architecture, ya FBA operations me kaise madad kar sakta hoon?";
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
        
        return "Mubashir Hasan ek expert AI Automation & Systems Architect hain. Unki professional automation systems aur case studies ki pure details portfolio dashboard par live hain. Direct contact ke liye aap +91 9575877758 ka use kar sakte hain.";
    }

    appendMessage(role, text) {
        const container = document.getElementById('chat-messages');
        const id = 'msg-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = role === 'user' ? 'user-msg p-4 text-[13px] ml-auto max-w-[85%] text-white text-right' : 'ai-msg p-4 text-[13px] mr-auto max-w-[85%] text-gray-300 text-left';
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

// Instantiate on boot
document.addEventListener('DOMContentLoaded', () => {
    window.assistant = new MuahshiAssistant();
});
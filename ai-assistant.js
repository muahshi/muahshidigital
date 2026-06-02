/**
 * Muahshi Digital - Personal AI Assistant Logic
 * Optimized lead classification, visual feedback toasts, and persistent history state.
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

    getSuggestions() {
        return [
            { label: "Bhopal Metro Job Pitch 🚇", text: "Bhopal Metro systems role ke liye Mubashir ideal candidate kyun hain?" },
            { label: "AI & n8n Skills ⚡", text: "Mubashir ne n8n aur AI automations me kya build kiya hai?" },
            { label: "Amazon FBA Scale 📦", text: "Amazon USA Operations me Mubashir ki kya expertise hai?" },
            { label: "Direct Contact 📲", text: "Mubashir se call ya whatsapp par connect kaise karein?" }
        ];
    }

    renderSuggestionPills() {
        const stream = document.getElementById('chat-messages') || document.getElementById('chatStream');
        if (!stream) return;

        // Clean previous container if exists
        const existingContainer = document.getElementById('suggestion-pills-container');
        if (existingContainer) existingContainer.remove();

        const pillsContainer = document.createElement('div');
        pillsContainer.id = "suggestion-pills-container";
        pillsContainer.className = "flex flex-wrap gap-2 pt-3 justify-start";

        this.getSuggestions().forEach(sug => {
            const pill = document.createElement('button');
            pill.className = "bg-white/[0.03] hover:bg-[#C9A84C]/10 border border-white/5 hover:border-[#C9A84C]/40 text-[#A1A1A0] hover:text-white text-[10px] px-3 py-1.5 rounded-xl transition duration-300 font-medium text-left";
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

        const typingId = this.appendMessage('ai', 'Processing system vectors...');

        try {
            // Call serverless Groq controller
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: [...this.history, { role: 'user', content: text }] 
                })
            });

            if (!res.ok) throw new Error("API Route Fallback triggered.");

            const data = await res.json();
            const reply = data.choices[0].message.content;

            const typingElem = document.getElementById(typingId);
            if (typingElem) typingElem.remove();

            this.appendMessage('ai', reply);
            this.speak(reply);
            
            this.history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });

            // Smart Lead Classification (Notify only when genuine contact intents are detected)
            this.evaluateLeadTrigger(text, reply);

        } catch (e) {
            const typingElem = document.getElementById(typingId);
            if (typingElem) typingElem.remove();

            const reply = this.getFallbackReply(text);
            this.appendMessage('ai', reply);
            this.speak(reply);
            
            this.history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });
            this.evaluateLeadTrigger(text, reply);
        }
    }

    evaluateLeadTrigger(userInput, aiResponse) {
        const query = userInput.toLowerCase();
        
        // Regex models to detect real email or contact number share, or explicit hiring words
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const phoneRegex = /(\+?\d{1,4}[\s-])?(?!0000000000)\d{10}/g;
        
        const hasContact = emailRegex.test(query) || phoneRegex.test(query);
        const hasExplicitIntent = query.includes('hire') || query.includes('connect') || query.includes('contact') || query.includes('phone') || query.includes('call back') || query.includes('website banwani');

        if (hasContact || hasExplicitIntent) {
            this.sendNotification(userInput);
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
            return "Aap Mubashir se directly +91 9575877758 par WhatsApp ya muahshi.mubi@gmail.com par connect kar sakte hain. Unka professional response rate kaafi fast hai.";
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
        
        // Always place the dynamic recommendation pills under the latest assistant response
        this.renderSuggestionPills();
        
        container.scrollTop = container.scrollHeight;
        return id;
    }

    speak(text) {
        if (!this.synth) return;
        this.synth.cancel();
        const cleanText = text.replace(/<\/?[^>]+(>|$)/g, "");
        const ut = new SpeechSynthesisUtterance(cleanText);
        ut.lang = 'hi-IN';
        ut.rate = 1.1;
        this.synth.speak(ut);
    }

    async sendNotification(query) {
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'notification', query: query })
            });
            if (res.ok) {
                // Render a beautiful sleek system toast bubble only when notification is dispatched successfully
                this.renderSystemToast("⚡ System Lead successfully dispatched to Mubashir.");
            }
        } catch(e) {}
    }

    renderSystemToast(msgText) {
        const container = document.getElementById('chat-messages') || document.getElementById('chatStream');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = "w-fit mx-auto bg-[#C9A84C]/10 border border-[#C9A84C]/35 text-[#C9A84C] text-[10px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-lg text-center animate-pulse my-2";
        toast.innerText = msgText;

        container.appendChild(toast);
        container.scrollTop = container.scrollHeight;
    }
}

// Instantiate on boot
document.addEventListener('DOMContentLoaded', () => {
    window.assistant = new MuahshiAssistant();
});
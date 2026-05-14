/**
 * Muahshi Digital - Personal AI Assistant
 * Optimized for Premium Dark/Gold Theme
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

        trigger.onclick = () => {
            box.classList.toggle('active');
            const icon = trigger.querySelector('i');
            icon.className = box.classList.contains('active') ? 'fas fa-chevron-down' : 'fas fa-comment-dots';
        };

        close.onclick = () => {
            box.classList.remove('active');
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

        try {
            // Typing Indicator
            const typingId = this.appendMessage('ai', 'Thinking...');

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: [...this.history, { role: 'user', content: text }] 
                })
            });

            const data = await res.json();
            const reply = data.choices[0].message.content;

            // Remove typing indicator and add real message
            document.getElementById(typingId).remove();
            this.appendMessage('ai', reply);
            this.speak(reply);
            
            this.history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });

            // Telegram Lead Trigger
            if (reply.includes('Mubashir tak pahuch jayega') || text.toLowerCase().includes('connect') || text.toLowerCase().includes('contact')) {
                this.sendNotification(text);
            }

        } catch (e) {
            console.error(e);
            this.appendMessage('ai', "System busy hai, please try again later.");
        }
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
        await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'notification', query: query })
        });
    }
}

// Global Init
document.addEventListener('DOMContentLoaded', () => {
    window.assistant = new MuahshiAssistant();
});

```

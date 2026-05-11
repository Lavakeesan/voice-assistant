"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your AI Assistant. How can I help you today?", sender: "bot", timestamp: null },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState("en-US"); // Default to English for better accessibility
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    setMessages(prev => prev.map(m => m.timestamp === null ? { ...m, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : m));

    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = language; 

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event) => {
          if (event.error === "aborted") return;
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (err) {
          console.error("Failed to start recognition:", err);
        }
      } else {
        alert("Speech recognition is not supported in this browser. Try Chrome or Safari.");
      }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { 
      text: input, 
      sender: "user", 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };
    
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: currentInput,
          history: messages
            .slice(1)
            .map(msg => ({
              role: msg.sender === "user" ? "user" : "model",
              parts: [{ text: msg.text }]
            }))
        }),
      });

      if (!response.ok) throw new Error("Failed to connect to backend");

      const data = await response.json();

      setMessages((prev) => [...prev, { 
        text: data.text, 
        sender: "bot", 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } catch (error) {
      console.error("Chat API Error:", error);
      setMessages((prev) => [...prev, { 
        text: "I'm sorry, I'm having trouble connecting to my brain right now. Please make sure the backend is running.", 
        sender: "bot", 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full bg-blue-500/10 blur-[110px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 group">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 transform group-hover:scale-105 transition-transform duration-300 animate-float">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8V4H8"></path>
                  <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                  <path d="M2 14h2"></path>
                  <path d="M20 14h2"></path>
                  <path d="M15 13v2"></path>
                  <path d="M9 13v2"></path>
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#020617] shadow-sm animate-pulse-soft" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                Aura AI
              </h1>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">
                Powered by Gemini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-white/20 dark:border-slate-700/50">
            {["ta-IN", "si-LK", "en-US"].map((lang) => (
              <button 
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                  language === lang 
                    ? "bg-white dark:bg-slate-700 shadow-md text-indigo-600 dark:text-indigo-400 scale-100" 
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 scale-95 opacity-70"
                }`}
              >
                {lang === "ta-IN" ? "தமிழ்" : lang === "si-LK" ? "සිංහල" : "EN"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}
            >
              <div className={`flex flex-col gap-2 max-w-[85%] md:max-w-[75%]`}>
                <div
                  className={`relative px-6 py-4 rounded-[2rem] shadow-sm transition-all duration-300 ${
                    msg.sender === "user"
                      ? "bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-tr-none shadow-indigo-500/20"
                      : "bg-white dark:bg-slate-800/80 dark:border-slate-700/50 border border-slate-200/50 rounded-tl-none shadow-slate-200/50 dark:shadow-none"
                  }`}
                >
                  <p className="text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                    {msg.text}
                  </p>
                  
                  {/* Subtle decorative dot for user messages */}
                  {msg.sender === "user" && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-400 rounded-full blur-[1px] opacity-50" />
                  )}
                </div>
                <span className={`text-[10px] font-semibold tracking-wider opacity-40 px-2 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                  {msg.timestamp || '--:--'}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-[2rem] rounded-tl-none px-6 py-4 shadow-sm">
                <div className="flex gap-2 items-center">
                  <div className="flex gap-1.5 py-1">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-violet-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Thinking</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Footer */}
      <footer className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSend}
            className="relative flex items-center group"
          >
            <div className="flex-1 relative glass-effect rounded-[2.5rem] p-2 flex items-center shadow-xl shadow-indigo-500/5 dark:shadow-none transition-all duration-300 focus-within:shadow-indigo-500/10 focus-within:ring-2 focus-within:ring-indigo-500/20">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening with intent..." : "Ask Aura anything..."}
                className="w-full pl-6 pr-24 py-4 bg-transparent border-none focus:outline-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base font-medium"
              />
              
              <div className="absolute right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isListening 
                      ? "bg-rose-500 text-white scale-110 shadow-lg shadow-rose-500/40" 
                      : "text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                  }`}
                  title={isListening ? "Stop listening" : "Voice message"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                  </svg>
                </button>
                
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-11 h-11 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-800 text-white flex items-center justify-center transition-all duration-300 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-95"
                  title="Send Message"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </div>
          </form>
          
          <div className="mt-4 flex items-center justify-center gap-8 text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
              <span>System Active</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
            <span>Press Enter to sync</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


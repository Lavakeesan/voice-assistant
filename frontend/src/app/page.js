"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you today?", sender: "bot", timestamp: null },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    // Set initial message timestamp on client to avoid hydration mismatch
    setMessages(prev => prev.map(m => m.timestamp === null ? { ...m, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : m));
  }, []);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    setInput(""); // Clear input field
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: currentInput,
          // Convert history to Gemini format, ensuring it starts with a 'user' message
          history: messages
            .slice(1) // Skip the very first message (welcome message) to ensure history starts with user
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
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-zinc-950 font-sans">
      {/* Header */}
      <header className="p-4 border-b bg-white dark:bg-zinc-900 dark:border-zinc-800 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">AI Assistant</h1>
            <p className="text-xs text-green-500 font-medium">Online</p>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <div className="max-w-3xl mx-auto space-y-6 pb-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              } animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 border dark:border-zinc-700 rounded-bl-none"
                }`}
              >
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-[10px] mt-1 opacity-70 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                  {msg.timestamp || '--:--'}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 border dark:border-zinc-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 py-1">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Form */}
      <footer className="p-4 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <form
          onSubmit={handleSend}
          className="max-w-3xl mx-auto relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message AI Assistant..."
            className="w-full pl-4 pr-16 py-3.5 rounded-2xl border border-gray-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-zinc-700 text-white transition-all disabled:cursor-not-allowed group shadow-md"
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
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
        <div className="max-w-3xl mx-auto mt-2 flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-widest font-medium">
          <span>Press Enter to send</span>
          <span>Next.js + Tailwind CSS</span>
        </div>
      </footer>
    </div>
  );
}

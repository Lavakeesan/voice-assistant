"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initial welcome message if no messages
    if (messages.length === 0) {
      setMessages([{ 
        text: "How can I help you today?", 
        sender: "bot", 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    }

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
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (recognitionRef.current) recognitionRef.current.lang = language;
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
          console.error(err);
        }
      } else {
        alert("Speech recognition not supported.");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: currentInput,
          history: messages.map(msg => ({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }]
          }))
        }),
      });

      if (!response.ok) throw new Error("Backend error");

      const data = await response.json();

      setMessages((prev) => [...prev, { 
        text: data.text, 
        sender: "bot", 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, { 
        text: "Error connecting to service.", 
        sender: "bot", 
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#212121] text-gray-800 dark:text-[#ececf1]">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? "w-[260px]" : "w-0"} transition-all duration-300 bg-[#f9f9f9] dark:bg-[#171717] flex flex-col overflow-hidden`}>
        <div className="p-4 flex flex-col h-full">
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/5 transition-colors text-sm font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Chat
          </button>
          
          <div className="mt-4 flex-1 overflow-y-auto sidebar-scroll">
            <div className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-2 px-3">Recent</div>
            <div className="space-y-1">
              {["Voice Assistant Design", "Speech API help", "React layout fixes"].map((item, i) => (
                <button key={i} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#2f2f2f] text-sm truncate opacity-80 hover:opacity-100 transition-all">
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto border-t border-gray-200 dark:border-white/10 pt-4 px-2">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/5 cursor-pointer transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">AL</div>
              <span className="text-sm font-medium">Ananthavasan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 flex items-center justify-between px-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer">
            <span className="text-sm font-bold opacity-70">ChatGPT 4o</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>

          <div className="w-8" /> {/* Placeholder for balance */}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pt-4 pb-32">
          <div className="max-w-3xl mx-auto px-4 md:px-0">
            {messages.map((msg, index) => (
              <div key={index} className={`py-6 flex gap-4 md:gap-6 group ${index === 0 && messages.length === 1 ? "h-[40vh] items-center justify-center flex-col" : ""}`}>
                {index === 0 && messages.length === 1 ? (
                  <>
                    <div className="w-12 h-12 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center mb-4">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#10a37f]"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">{msg.text}</h2>
                  </>
                ) : (
                  <>
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${msg.sender === "user" ? "bg-gradient-to-tr from-orange-400 to-rose-400" : "border border-gray-200 dark:border-white/10"}`}>
                      {msg.sender === "user" ? (
                        <span className="text-xs font-bold text-white">AL</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#10a37f]"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs uppercase tracking-wider mb-1 opacity-50">
                        {msg.sender === "user" ? "You" : "ChatGPT"}
                      </div>
                      <div className={`prose dark:prose-invert max-w-none text-base leading-relaxed ${msg.sender === "user" ? "bg-[#f4f4f4] dark:bg-[#2f2f2f] rounded-2xl px-4 py-2 inline-block max-w-[90%]" : ""}`}>
                        {msg.text}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="py-6 flex gap-4 md:gap-6">
                <div className="w-8 h-8 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#10a37f] animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white dark:from-[#212121] via-white/80 dark:via-[#212121]/80 to-transparent pt-10 pb-6 px-4">
          <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleSend} className="relative group">
              <div className="bg-[#f4f4f4] dark:bg-[#2f2f2f] border border-transparent dark:border-white/10 rounded-[26px] min-h-[52px] flex items-center px-4 py-2 shadow-sm focus-within:border-gray-300 dark:focus-within:border-white/20 transition-all">
                <button 
                  type="button" 
                  onClick={() => {}} 
                  className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                </button>

                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message ChatGPT..."
                  className="flex-1 bg-transparent border-none outline-none px-2 text-[15px] placeholder-gray-500 dark:placeholder-gray-400"
                />

                <div className="flex items-center gap-1">
                  <button 
                    type="button" 
                    onClick={toggleListening}
                    className={`p-2 rounded-full transition-all ${isListening ? "bg-rose-500 text-white" : "text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>
                  </button>

                  <button 
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                  </button>
                </div>
              </div>
            </form>
            <div className="mt-2 text-center text-[11px] text-gray-500 dark:text-gray-400">
              ChatGPT can make mistakes. Check important info.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


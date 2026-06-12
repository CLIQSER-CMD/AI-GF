import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Calendar, Dumbbell, Heart, Flame, Send, 
  Award, BookOpen, Music, History, Sparkles, RefreshCw, 
  Volume2, VolumeX, AlertTriangle, Coffee, Compass, Smile, Info
} from "lucide-react";
import { Message, MaggieState, MemoryPoint } from "./types";
import { MEMORY_SCRAPBOOK, MOCK_SOUNDTRACKS, TRADING_ALERTS } from "./data";

// Predefined initial messages from the backstory
const INITIAL_MESSAGES: Message[] = [
  { id: "init-1", role: "assistant", content: "Hello, Saif? 😊", timestamp: "06:08" },
  { id: "init-2", role: "assistant", content: "Mai Bipasha...", timestamp: "06:08" },
  { id: "init-3", role: "assistant", content: "Yaad hai?", timestamp: "06:08" },
  { id: "init-4", role: "assistant", content: "Bahot time ho gaya na.", timestamp: "06:09" },
  { id: "init-5", role: "assistant", content: "Aaj achanak tumhari profile dekhi aur socha message kar hi deti hoon.", timestamp: "06:09" },
  { id: "init-6", role: "assistant", content: "Kaise ho?", timestamp: "06:09" }
];

const INITIAL_MAGGIE_STATE: MaggieState = {
  mood: "RESERVED",
  burgerCraving: 65,
  gymStatus: "Completed leg day! 💪",
  relationshipStance: "CAUTIOUS"
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [maggieState, setMaggieState] = useState<MaggieState>(INITIAL_MAGGIE_STATE);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<MemoryPoint | null>(null);
  const [activeSoundtrack, setActiveSoundtrack] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [needConfig, setNeedConfig] = useState(false);
  
  // Audio state (using browser synthesizing or beautiful visual pulse since iframe constraints prevent heavy audio files)
  const [isPlayingNoise, setIsPlayingNoise] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize conversations from localStorage or fallbacks
  useEffect(() => {
    const savedMsg = localStorage.getItem("saif_maggie_chat_v2");
    if (savedMsg) {
      try {
        setMessages(JSON.parse(savedMsg));
      } catch (e) {
        setMessages(INITIAL_MESSAGES);
      }
    } else {
      setMessages(INITIAL_MESSAGES);
    }

    const savedState = localStorage.getItem("maggie_state_v2");
    if (savedState) {
      try {
        setMaggieState(JSON.parse(savedState));
      } catch (e) {
        setMaggieState(INITIAL_MAGGIE_STATE);
      }
    }
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("saif_maggie_chat_v2", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("maggie_state_v2", JSON.stringify(maggieState));
  }, [maggieState]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle ambient lo-fi synthesizer for authentic Mumbai rain/wave mood inside sandboxed frame
  const toggleAmbientSoundtrack = (soundtrackId: string) => {
    if (activeSoundtrack === soundtrackId) {
      // Turn off
      stopSyntheticAtmosphere();
      setActiveSoundtrack(null);
    } else {
      setActiveSoundtrack(soundtrackId);
      startSyntheticAtmosphere(soundtrackId);
    }
  };

  const startSyntheticAtmosphere = (type: string) => {
    try {
      stopSyntheticAtmosphere();
      
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Create a gentle noise generator simulating sea waves or soft rain sound
      const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // White/pink-ish noise generation
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Simple low-pass filter to make it sound like gentle rain or waves instead of static hiss
        output[i] = lastOut * 0.95 + white * 0.05;
        lastOut = output[i];
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      
      if (type === "rain") {
        filter.frequency.value = 800; // soft rain
      } else if (type === "marine") {
        filter.frequency.value = 350; // oceanic low rumble
      } else {
        filter.frequency.value = 500; // general cozy hum
      }

      const gain = ctx.createGain();
      // Wave modulation for ocean theme
      if (type === "marine") {
        gain.gain.value = 0.08;
        // Modulate volume up and down slowly over 6 seconds to simulate tides
        const modulator = ctx.createOscillator();
        modulator.frequency.value = 0.15; // 0.15Hz is ~6.6 seconds per wave
        const modGain = ctx.createGain();
        modGain.gain.value = 0.05;
        modulator.connect(modGain);
        modGain.connect(gain.gain);
        modulator.start();
      } else {
        // Steady rain or tea-stall murmur
        gain.gain.value = 0.06;
      }

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start();
      setIsPlayingNoise(true);
    } catch (e) {
      console.warn("AudioContext not allowed or supported yet. Reacting on interaction.");
    }
  };

  const stopSyntheticAtmosphere = () => {
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (err) {}
      audioContextRef.current = null;
    }
    setIsPlayingNoise(false);
  };

  // Triggered message helper
  const handleQuickAction = (text: string) => {
    if (isTyping) return;
    sendMessage(text);
  };

  // Execute chatbot message sending
  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    setApiError(null);
    setInputText("");

    // Create unique user chat log
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: formattedTime
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setIsTyping(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedHistory })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 500 && errorData.isConfigError) {
          setNeedConfig(true);
          throw new Error("Gemini API key is not configured in Secrets panel.");
        }
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `maggie-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        mood: data.mood
      };

      setMessages(prev => [...prev, assistantMessage]);
      setMaggieState({
        mood: data.mood as any,
        burgerCraving: Number(data.burgerCraving) || 50,
        gymStatus: data.gymStatus || "Sweating it out!",
        relationshipStance: data.relationshipStance as any
      });

    } catch (e: any) {
      console.error(e);
      setApiError(e.message || "Could not connect to Mumbai server. Try again later.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const clearChatHistory = () => {
    if (window.confirm("Do you want to reset Saif and Bipasha's story and clear local history?")) {
      setMessages(INITIAL_MESSAGES);
      setMaggieState(INITIAL_MAGGIE_STATE);
      setSelectedMemory(null);
      localStorage.removeItem("saif_maggie_chat_v2");
      localStorage.removeItem("maggie_state_v2");
    }
  };

  // Help format relationship descriptions
  const getStanceDescription = (stance: string) => {
    switch (stance) {
      case "CAUTIOUS":
        return "Maggie is currently testing the waters. She is cautious but nostalgic about your old school memories.";
      case "WARMING_UP":
        return "She is opening up. The old Mumbai bond is starting to feel familiar again. Keep going!";
      case "TOUCHED":
        return "You said something that touched her heart deeply. She is reflecting on how much you have grown.";
      case "ANNOYED":
        return "She feels a bit moody or misunderstood. Clarify your intentions and avoid being over-possessive.";
      case "TRUSTING":
        return "Trust is being rebuilt! She is genuinely starting to believe that the letter issues can be resolved.";
      case "CRUSHING":
        return "The sparks are flying! Maggie feels those sweet butterflies in her stomach again. 🌸";
      case "NOSTALGIC":
        return "Lost in Borivali and St. Xavier's memories. She misses the simple rainy days.";
      default:
        return "Maggie is looking for real consistency. Respect her space and talk logically.";
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#fdf2f8] font-sans text-slate-800 overflow-hidden antialiased">
      
      {/* LEFT SIDEBAR: Maggie Profile & Interests (Aligned to Sleek Layout instructions) */}
      <aside className="w-80 bg-white/90 backdrop-blur-md border-r border-pink-100 flex flex-col shrink-0 hidden md:flex transition-all">
        {/* Profile Card Header */}
        <div className="p-6 pb-4 flex flex-col items-center text-center border-b border-pink-50">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full border-4 border-pink-100 p-1 mb-3 shadow-md bg-white text-center flex items-center justify-center transition-transform hover:scale-105">
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-pink-400 via-rose-400 to-amber-300 flex items-center justify-center text-3xl text-white font-serif font-bold shadow-inner">
                M
              </div>
            </div>
            <span className="absolute bottom-4 right-1 bg-green-500 w-4.5 h-4.5 rounded-full border-2 border-white animate-pulse" title="Living in Borivali, Mumbai"></span>
          </div>

          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5 justify-center">
            Maggie
            <span className="text-xs font-normal text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full">Bipasha</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-mono mt-1">Age 24 • Borivali, Mumbai</p>
          <p className="text-xs text-slate-500 mt-2 px-3 italic leading-relaxed">
            &ldquo;Mumbai girl at heart. Let&apos;s clear the air and see where this goes?&rdquo;
          </p>
        </div>

        {/* Dynamic State Quick-view widgets (Interests & Status) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 flex items-center justify-between">
              <span>Shared Past Memories</span>
              <History className="w-3 h-3 text-pink-400" />
            </div>
            
            <div className="space-y-1">
              {MEMORY_SCRAPBOOK.map((memory) => {
                const isSelected = selectedMemory?.id === memory.id;
                return (
                  <button
                    key={memory.id}
                    onClick={() => setSelectedMemory(memory)}
                    className={`w-full text-left flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-gradient-to-r from-pink-50 to-orange-50 text-pink-700 font-semibold border-l-4 border-pink-500 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50/80 hover:text-slate-900 border-l-4 border-transparent"
                    }`}
                  >
                    <span className="text-lg shrink-0">
                      {memory.id === "letter" ? "✉️" : memory.id === "marine-drive" ? "🌊" : memory.id === "candies" ? "🍔" : memory.id === "colaba" ? "💍" : "🏫"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{memory.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{memory.location} • {memory.year}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ambience tracks */}
          <div className="p-3 bg-pink-50/50 rounded-2xl border border-pink-100/40">
            <h3 className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Music className="w-3.5 h-3.5" />
              <span>Mumbai Monsoon Atmosphere</span>
            </h3>
            <div className="space-y-1.5">
              {MOCK_SOUNDTRACKS.map((track) => {
                const isActive = activeSoundtrack === track.id;
                return (
                  <button
                    key={track.id}
                    onClick={() => toggleAmbientSoundtrack(track.id)}
                    className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                      isActive 
                        ? "bg-pink-100 text-pink-800 font-medium shadow-xs" 
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <span className="text-xs">{isActive ? "🔊" : "🎧"}</span>
                      {track.title}
                    </span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-slate-400 mt-2 text-center">
              (Synthesizes dynamic ambient white noise loops)
            </p>
          </div>
        </div>

        {/* Footer: Maggie's Core Lifestyle tags */}
        <div className="p-4 border-t border-pink-50 bg-slate-50/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Her Mumbai Vibe</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="px-2 py-0.5 bg-white text-[10px] font-medium text-slate-600 rounded-md border border-slate-100 shadow-3xs flex items-center gap-1">
              <span>✈️</span> Travel
            </span>
            <span className="px-2 py-0.5 bg-white text-[10px] font-medium text-slate-600 rounded-md border border-slate-100 shadow-3xs flex items-center gap-1">
              <span>💪</span> Gym
            </span>
            <span className="px-2 py-0.5 bg-white text-[10px] font-medium text-slate-600 rounded-md border border-slate-100 shadow-3xs flex items-center gap-1">
              <span>🍿</span> RomComs
            </span>
            <span className="px-2 py-0.5 bg-white text-[10px] font-medium text-slate-600 rounded-md border border-slate-100 shadow-3xs flex items-center gap-1">
              <span>🍔</span> Burgers
            </span>
            <span className="px-2 py-0.5 bg-white text-[10px] font-medium text-slate-600 rounded-md border border-slate-100 shadow-3xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pink-400 inline-block"></span> Pink
            </span>
          </div>
        </div>
      </aside>

      {/* CENTRAL MESSAGE STEAM PANEL */}
      <main className="flex-1 flex flex-col bg-white shadow-xl md:m-4 md:rounded-[2rem] overflow-hidden border border-pink-100/30">
        
        {/* Chat Header */}
        <header className="h-20 border-b border-pink-50/70 flex items-center justify-between px-6 bg-white/70 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold font-serif text-lg border-2 border-pink-200">
                M
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h2 className="font-bold text-slate-900 tracking-tight text-sm md:text-base">Saif & Maggie (Bipasha)</h2>
              <p className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                <span>Instagram Chat</span>
                <span>•</span>
                <span className="text-pink-500 font-semibold uppercase tracking-wider text-[9px] bg-pink-50 px-1 rounded">6-Yr Silence Broken</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={clearChatHistory}
              title="Reset Chat & Memory"
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-full transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <span className="h-6 w-px bg-slate-100 mx-1"></span>
            <div className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-[11px] font-medium flex items-center gap-1.5">
              <span>Mood:</span>
              <strong className="tracking-wide text-xs">{maggieState.mood}</strong>
            </div>
          </div>
        </header>

        {/* Message View Area */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gradient-to-b from-slate-50/40 via-white to-pink-50/10 space-y-4">
          
          {/* Backstory Alert Banner */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-pink-50 rounded-2xl border border-amber-100/60 text-xs text-slate-600 leading-relaxed shadow-3xs">
            <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              A Borivali Reunion Story
            </p>
            You growing up together in the same apartments, but separated six years ago after a major letter misunderstanding. Maggie (Bipasha) has found you on Instagram. Rebuild her trust. Show her your stock market ambition, study drive, and discipline.
          </div>

          {/* Main message loop */}
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div key={msg.id || index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3.5 transition-all shadow-3xs hover:shadow-2xs ${
                  isUser 
                    ? 'bg-slate-900 text-white rounded-br-none font-sans font-medium' 
                    : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/40'
                }`}>
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  
                  <div className={`flex items-center gap-1.5 mt-1.5 text-[9px] ${isUser ? 'text-slate-300 justify-end' : 'text-slate-400'}`}>
                    <span>{msg.timestamp}</span>
                    {!isUser && msg.mood && (
                      <>
                        <span>•</span>
                        <span className="text-[8px] bg-pink-50 border border-pink-100 text-pink-500 px-1 py-0.2 rounded font-mono uppercase tracking-tight">
                          {msg.mood}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-100 rounded-2xl rounded-bl-none p-4 max-w-[70%] border border-slate-200/40">
                <div className="flex space-x-1 items-center h-4">
                  <span className="text-[11px] text-slate-400 italic mr-1.5 flex items-center gap-1">
                    Maggie typing
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span>
                  </span>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}

          {/* Errors or configuration helpers */}
          {apiError && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-semibold">Mumbai Server Offline</p>
                <p className="mt-0.5 opacity-90">{apiError}</p>
                {needConfig && (
                  <div className="bg-white/80 p-2 rounded-lg border border-rose-200 mt-2 text-[11px]">
                    <strong>Action Required:</strong> Please go to the <strong>Secrets Panel</strong> in AI Studio (click gear icon / secrets) and set key <code>GEMINI_API_KEY</code> to your Google AI Studio key, then refresh!
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Trading & Nostalgic prompt triggers (Allows Saif to direct the conversation easily) */}
        <div className="px-4 py-2 border-t border-slate-100 bg-white shadow-inner flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
          {TRADING_ALERTS.map((alert, idx) => (
            <button
              key={idx}
              disabled={isTyping}
              onClick={() => handleQuickAction(alert.text)}
              className="px-3 py-1.5 bg-pink-50/60 hover:bg-pink-100 hover:text-pink-800 disabled:opacity-50 text-slate-700 rounded-full text-xs font-medium cursor-pointer transition-all border border-pink-100 shrink-0 flex items-center gap-1 shadow-3xs"
            >
              <Sparkles className="w-3 h-3 text-pink-400" />
              {alert.label}
            </button>
          ))}
        </div>

        {/* Form Messenger Footer input area */}
        <footer className="p-4 bg-slate-50/50 border-t border-pink-50 flex flex-col shrink-0">
          <form onSubmit={handleFormSubmit} className="relative flex items-center">
            <input
              type="text"
              disabled={isTyping}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Write a text in Hindi, Hinglish, or English (e.g. 'Yaar, Borivali rains are...')"
              className="w-full bg-white border border-slate-200 rounded-full py-3.5 px-5 pr-14 focus:outline-none focus:ring-2 focus:ring-pink-200 text-slate-800 placeholder:text-slate-400 shadow-3xs text-xs md:text-sm transition-all"
            />
            <button
              type="submit"
              disabled={isTyping || !inputText.trim()}
              className="absolute right-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-full hover:from-pink-600 hover:to-rose-700 disabled:opacity-40 shadow-sm hover:shadow active:scale-95 cursor-pointer text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-2.5">
            <span>Keep your texts natural. Ask her about her day & fitness.</span>
            <span>Mumbai Standard Time • Borivali</span>
          </div>
        </footer>

      </main>

      {/* RIGHT SIDEBAR: Saif Tracker & Interactive Radar */}
      <aside className="w-80 p-6 bg-white/70 backdrop-blur-md border-l border-pink-100 flex flex-col gap-5 shrink-0 hidden lg:flex">
        
        {/* Radar box */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-pink-50">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
            <Smile className="w-4 h-4 text-pink-400" />
            <span>Maggie&apos;s Radar</span>
          </h3>

          <div className="space-y-4">
            
            {/* Relationship Stance */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-500 font-medium">Stance:</span>
                <span className="font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full text-[10px] tracking-wide">
                  {maggieState.relationshipStance}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-pink-500 h-full rounded-full transition-all duration-1000"
                  style={{
                    width: 
                      maggieState.relationshipStance === "CRUSHING" ? "100%" : 
                      maggieState.relationshipStance === "TRUSTING" ? "85%" : 
                      maggieState.relationshipStance === "TOUCHED" ? "70%" : 
                      maggieState.relationshipStance === "WARMING_UP" ? "55%" : 
                      maggieState.relationshipStance === "CAUTIOUS" ? "35%" : 
                      maggieState.relationshipStance === "ANNOYED" ? "15%" : "25%"
                  }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                {getStanceDescription(maggieState.relationshipStance)}
              </p>
            </div>

            {/* Burger Craving Bar */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-500 font-medium">Burger Hunger:</span>
                <span className="font-bold text-amber-600">{maggieState.burgerCraving}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${maggieState.burgerCraving}%` }}
                ></div>
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5 flex items-center gap-1">
                <span>🍔</span> 
                {maggieState.burgerCraving > 80 
                  ? "Starving! Suggest a cheesy Candies burger treat immediately."
                  : maggieState.burgerCraving > 40 
                    ? "Craving sweet/savory Mumbai snacks. Mention post-gym burger."
                    : "Not starving right now, but she'll never reject a treat."}
              </p>
            </div>

            {/* Gym Update Block */}
            <div className="p-3 bg-amber-50/40 rounded-2xl border border-amber-100/30">
              <div className="flex items-center gap-2 mb-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Maggie Fitness</span>
              </div>
              <p className="text-xs text-slate-700 italic font-medium">&ldquo;{maggieState.gymStatus}&rdquo;</p>
            </div>

          </div>
        </div>

        {/* Saif Tracker Container */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl"></div>
          
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Saif&apos;s Status Grid</span>
          </h3>

          <div className="space-y-3 flex-1">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <p className="text-[10px] text-pink-400 font-bold uppercase tracking-wide">Main Study focus</p>
              <p className="text-xs font-semibold text-white mt-1">Nifty, Technical Indicators & Macro Economics</p>
            </div>

            <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
              <p className="text-[10px] text-pink-400 font-bold uppercase tracking-wide">Business Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                <span className="text-xs text-white">Consistent Daily Profit Margin Targets</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-300 italic leading-relaxed">
              *Maggie admires your grit. Keep checking trends under the input box & share trading plans to boost your romance sync!
            </p>
          </div>
        </div>

        {/* Selected Memory Scrapbook Expanded Box */}
        <div className="flex-1 bg-white p-5 rounded-3xl border border-slate-100 flex flex-col">
          {selectedMemory ? (
            <div className={`p-4 rounded-2xl border flex-1 flex flex-col justify-between ${selectedMemory.bgColor} transition-all`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/50 px-2 py-0.5 rounded">
                    {selectedMemory.year} Memory
                  </span>
                  <Coffee className="w-3.5 h-3.5" />
                </div>
                <h4 className="font-bold text-sm mt-2 leading-tight">{selectedMemory.title}</h4>
                <p className="text-[10px] opacity-80 mt-1">{selectedMemory.location}</p>
                <p className="text-xs leading-relaxed mt-2.5 font-sans justify-center">{selectedMemory.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-black/5 flex flex-col gap-2">
                <button
                  onClick={() => {
                    const nostalgicPrompt = `Maggie, do you remember when we were at ${selectedMemory.title} in ${selectedMemory.year}? Honestly, I was looking back at it...`;
                    handleQuickAction(nostalgicPrompt);
                    setSelectedMemory(null);
                  }}
                  className="w-full py-1.5 bg-white hover:bg-black/5 text-slate-800 text-[11px] font-bold rounded-xl transition-all shadow-xs cursor-pointer text-center"
                >
                  Reminisce with Her 💭
                </button>
                <button
                  onClick={() => setSelectedMemory(null)}
                  className="w-full text-center text-[10px] text-slate-500 hover:text-slate-800"
                >
                  Close Scrapbook
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <span className="text-4xl mb-2 grayscale opacity-75">📜</span>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Shared Past scrapbook</p>
              <p className="text-[10px] text-slate-400 mt-2 px-3 leading-relaxed">
                Click a memory in the left sidebar to recount a sweet Borivali moment together with Maggie.
              </p>
            </div>
          )}
        </div>

      </aside>

    </div>
  );
}

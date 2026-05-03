import React, { useState, useRef, useEffect } from 'react';
import { Card, Button } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { getTherapyResponse } from '../services/gemini';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { Send, User, Brain, ArrowDown, Sparkles, Mic, MicOff, Volume2, VolumeX, AlertTriangle, Trash2, Loader2, Plus, MessageSquare, MessageSquarePlus, X, Menu, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: any;
  lastMessageAt?: any;
}

const Chat: React.FC = () => {
  const { user, userData } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const speechAbortController = useRef<boolean>(false);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [voicePersona, setVoicePersona] = useState<'gentle' | 'warm' | 'calm'>(userData?.voicePersona || 'warm');
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Sync voice persona from user data
  useEffect(() => {
    if (userData?.voicePersona) {
      setVoicePersona(userData.voicePersona);
    }
  }, [userData?.voicePersona]);

  const updateVoicePersona = async (persona: 'gentle' | 'warm' | 'calm') => {
    setVoicePersona(persona);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          voicePersona: persona
        });
      } catch (err) {
        console.error("Error updating voice persona:", err);
      }
    }
  };
  
  // Rotating loading messages
  useEffect(() => {
    if (!loading) return;
    
    const interval = setInterval(() => {
      setLoadingMessageIndex(prev => (prev + 1) % 4);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [loading]);

  const loadingMessages = [
    "Listening with deep empathy...",
    "Reflecting on your journey...",
    "Seeking the right words for you...",
    "Holding space for your thoughts..."
  ];
  // Initialize Soothing Voices
  useEffect(() => {
    const initVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const englishVoices = voices.filter(v => 
          v.lang.startsWith('en') || v.lang.startsWith('en-')
        );
        
        // Priority list for more natural, clear voices
        const soothingKeywords = [
          'natural', 'neural', 'premium', 'high quality', 'enhanced', 
          'google us english', 'google uk english', 'google india english',
          'samantha', 'victoria', 'serena', 'guy', 'daniel', 'karen', 'ava', 'allison'
        ];
        
        // Sort voices to put "soothing" or high-res ones first
        const sorted = [...englishVoices].sort((a, b) => {
          const aLower = a.name.toLowerCase();
          const bLower = b.name.toLowerCase();
          
          // Neural/Natural usually sounds much better
          const aNatural = aLower.includes('natural') || aLower.includes('neural') || aLower.includes('premium');
          const bNatural = bLower.includes('natural') || bLower.includes('neural') || bLower.includes('premium');
          
          if (aNatural && !bNatural) return -1;
          if (!aNatural && bNatural) return 1;

          const aMatch = soothingKeywords.findIndex(k => aLower.includes(k));
          const bMatch = soothingKeywords.findIndex(k => bLower.includes(k));
          
          if (aMatch === -1 && bMatch === -1) return 0;
          if (aMatch === -1) return 1;
          if (bMatch === -1) return -1;
          return aMatch - bMatch;
        });

        const topVoices = sorted.slice(0, 8); // Keep it manageable
        setAvailableVoices(topVoices);
        
        // Pick best default if not already set
        if (!selectedVoiceName && topVoices.length > 0) {
          setSelectedVoiceName(topVoices[0].name);
        }
      }
    };

    initVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = initVoices;
    }
    return () => { 
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null; 
    };
  }, [selectedVoiceName]);

  useEffect(() => {
    const loadSessions = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'users', user.uid, 'chatSessions'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const loadedSessions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChatSession[];
        
        setSessions(loadedSessions);
        if (loadedSessions.length > 0 && !activeSessionId) {
          setActiveSessionId(loadedSessions[0].id);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/chatSessions`);
      } finally {
        setSessionsLoading(false);
      }
    };
    loadSessions();
  }, [user]);

  // Load Messages for Active Session
  useEffect(() => {
    const loadMessages = async () => {
      if (!user || !activeSessionId) {
        setMessages([]);
        setHistoryLoading(false);
        return;
      }
      
      setHistoryLoading(true);
      try {
        const q = query(
          collection(db, 'users', user.uid, 'chatSessions', activeSessionId, 'messages'),
          orderBy('createdAt', 'asc'),
          limit(100)
        );
        
        const snapshot = await getDocs(q);
        const savedMessages: Message[] = snapshot.docs.map(doc => ({
          role: doc.data().role,
          parts: [{ text: doc.data().text }]
        }));
        
        setMessages(savedMessages);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/chatSessions/${activeSessionId}/messages`);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadMessages();
  }, [user, activeSessionId]);

  const createNewSession = async () => {
    if (!user || creatingSession) return;
    
    // Verification Check
    if (!user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCreatingSession(true);

    // Stop speaking if starting a new session
    speechAbortController.current = true;
    window.speechSynthesis.cancel();
    setIsAiSpeaking(false);

    // 1. Check if ANY session in the list is empty (no messages sent yet)
    // Robust check: No lastMessageAt AND messages array is empty
    const currentBlank = activeSessionId && messages.length === 0;
    const existingBlankSession = sessions.find(s => !s.lastMessageAt);
    
    if (currentBlank) {
      setIsSidebarOpen(false);
      setCreatingSession(false);
      return;
    }

    if (existingBlankSession) {
      setActiveSessionId(existingBlankSession.id);
      setIsSidebarOpen(false);
      setCreatingSession(false);
      return;
    }

    try {
      const newSession = {
        title: `New Discussion ${new Date().toLocaleDateString()}`,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'users', user.uid, 'chatSessions'), newSession);
      const sessionWithId = { id: docRef.id, ...newSession } as ChatSession;
      setSessions(prev => [sessionWithId, ...prev]);
      setActiveSessionId(docRef.id);
      setMessages([]);
      setIsSidebarOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/chatSessions`);
    } finally {
      setCreatingSession(false);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Custom confirmation logic
    if (deletingSessionId !== sessionId) {
      setDeletingSessionId(sessionId);
      // Auto-cancel after 3 seconds if not clicked again
      setTimeout(() => {
        setDeletingSessionId(prev => prev === sessionId ? null : prev);
      }, 3000);
      return;
    }

    try {
      setDeletingSessionId(null);
      // First delete messages (subcollection)
      const q = query(collection(db, 'users', user.uid!, 'chatSessions', sessionId, 'messages'));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      // Then delete session
      batch.delete(doc(db, 'users', user.uid!, 'chatSessions', sessionId));
      await batch.commit();
      
      setSessions(prev => {
        const filtered = prev.filter(s => s.id !== sessionId);
        // If we deleted the active session, switch to the first available one or null
        if (activeSessionId === sessionId) {
          const nextActive = filtered.length > 0 ? filtered[0].id : null;
          setActiveSessionId(nextActive);
          if (!nextActive) setMessages([]);
        }
        return filtered;
      });
    } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user!.uid}/chatSessions/${sessionId}`);
    }
  };

  // Track input in ref for callback access
  useEffect(() => {
    inputRef.current = input;
  }, [input]);
  
  // Global Speech Cleanup on Unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  // Speech Recognition Setup
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Recognition start error:', err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (isHandsFree) {
            handleVoiceSend(transcript);
        } else {
            setInput(transcript);
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [isHandsFree]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Restart speech when persona changes to show effect
  useEffect(() => {
    if (isAiSpeaking && messages.length > 0) {
      const lastModelMessage = [...messages].reverse().find(m => m.role === 'model');
      if (lastModelMessage) {
        speakText(lastModelMessage.parts[0].text);
      }
    }
  }, [voicePersona]);

  const previewVoice = () => {
    const text = "I am here to listen and support you in your journey of healing.";
    speakText(text);
  };

  const speakText = async (text: string) => {
    if (!isSpeaking) return;
    speechAbortController.current = false;
    window.speechSynthesis.cancel();
    
    // Small delay to ensure previous speech is fully purged by OS
    await new Promise(resolve => setTimeout(resolve, 50));
    const cleanText = text.replace(/[#*`]/g, '').trim();
    if (!cleanText) {
      setIsAiSpeaking(false);
      return;
    }

    // Split text into sentences for more natural pacing
    const sentences = cleanText.match(/[^.!?]+[.!?]*/g) || [cleanText];
    
    setIsAiSpeaking(true);

    for (let i = 0; i < sentences.length; i++) {
      // Check if we should abort
      if (speechAbortController.current || !window.speechSynthesis) break;
      
      const utterance = new SpeechSynthesisUtterance(sentences[i].trim());
      const voice = availableVoices.find(v => v.name === selectedVoiceName);
      if (voice) {
        utterance.voice = voice;
      }
      
      // Soothing parameters based on persona
      const personaConfig = {
        gentle: { rate: 0.75, pitch: 1.15 }, // Slower, softer/higher
        warm: { rate: 1.0, pitch: 1.05 },    // Natural, friendly
        calm: { rate: 0.82, pitch: 0.85 }    // Deep, steady, slow
      };
      
      const config = personaConfig[voicePersona] || personaConfig.warm;
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;
      utterance.volume = 1.0;

      // Wrap the utterance in a promise to wait for it to finish gracefully
      const speakSentence = () => new Promise<void>((resolve) => {
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });

      await speakSentence();
      
      // Small "thoughtful" pause between sentences unless it's the last one
      if (i < sentences.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 350));
      } else {
        setIsAiSpeaking(false);
        if (isHandsFree) {
          // Short delay before listening again to avoid hearing self
          setTimeout(() => startListening(), 500);
        }
      }
    }
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    processMessage(input);
  };

  const handleVoiceSend = (transcript: string) => {
    if (!transcript.trim() || loading) return;
    processMessage(transcript);
  };

  const processMessage = async (text: string) => {
    if (!activeSessionId && user) {
        // Auto create session if none exists
        await createNewSession();
    }
    
    // Stop any existing speech
    speechAbortController.current = true;
    window.speechSynthesis.cancel();
    setIsAiSpeaking(false);
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'hurt myself', 'self-harm', 'die', 'don\'t want to live', 'goodbye world'];
    const lowerText = text.toLowerCase();
    const isCrisis = crisisKeywords.some(keyword => lowerText.includes(keyword));
    
    if (isCrisis) {
      setShowCrisisAlert(true);
    }

    const userMessage: Message = { 
      role: 'user', 
      parts: [{ text }] 
    };
    
    // Save user message to Firestore subcollection
    if (user && activeSessionId) {
      await addDoc(collection(db, 'users', user.uid, 'chatSessions', activeSessionId, 'messages'), {
        role: 'user',
        text: text,
        createdAt: serverTimestamp()
      }).catch(err => console.error("Error saving user message:", err));
      
      // Update session title if it was default
      const currentSession = sessions.find(s => s.id === activeSessionId);
      if (currentSession && currentSession.title.startsWith('New Discussion')) {
          const newTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '');
          updateDoc(doc(db, 'users', user.uid, 'chatSessions', activeSessionId), {
              title: newTitle
          }).catch(() => {});
          setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title: newTitle } : s));
      }
      
      // Update session last message time
      // Using a background update, non-blocking
      updateDoc(doc(db, 'users', user.uid, 'chatSessions', activeSessionId), {
        lastMessageAt: serverTimestamp()
      }).catch(() => {});
    }

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setLoadingStep(loadingMessages[0]);

    try {
      const stream = await getTherapyResponse(text, messages, userData);
      let fullResponse = '';
      
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

      for await (const chunk of stream) {
        fullResponse += chunk.text;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          const rest = prev.slice(0, -1);
          return [...rest, { ...last, parts: [{ text: fullResponse }] }];
        });
      }

      // Save AI response to Firestore
      if (user && activeSessionId) {
        await addDoc(collection(db, 'users', user.uid, 'chatSessions', activeSessionId, 'messages'), {
          role: 'model',
          text: fullResponse,
          createdAt: serverTimestamp()
        }).catch(err => console.error("Error saving model response:", err));
      }

      // Speak the response when finished
      speakText(fullResponse);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: "I'm sorry, I encountered an error. Please try again or reach out to a professional if you're in distress." }] }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-8rem)] flex gap-8">
      {/* Session Sidebar */}
      <div className={`fixed inset-0 z-50 bg-white/80 backdrop-blur-sm lg:relative lg:bg-transparent lg:inset-auto lg:z-0 lg:flex flex-col w-72 transition-all ${isSidebarOpen ? 'flex' : 'hidden'}`}>
        <Card className="flex-1 flex flex-col p-4 shadow-xl border-gray-100 h-full overflow-hidden">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="font-black uppercase text-xs tracking-widest text-gray-400">Chat History</h3>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-500">
                <X className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={createNewSession}
            className={`w-full p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all mb-6 ${
              user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password'
              ? 'bg-amber-100 text-amber-700 cursor-not-allowed opacity-80'
              : 'bg-primary/10 text-primary hover:bg-primary/20 shadow-lg shadow-primary/5'
            }`}
          >
            {user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' ? <ShieldAlert className="w-4 h-4" /> : <MessageSquarePlus className="w-4 h-4" />}
            {user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' ? 'Verification Required' : 'New Chat'}
          </button>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            <div className="px-2 mb-4">
              <Button 
                onClick={createNewSession}
                loading={creatingSession}
                className="w-full rounded-2xl py-3 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                <span>New Session</span>
              </Button>
            </div>
            
            {sessionsLoading ? (
               <div className="flex flex-col gap-2">
                   {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
               </div>
            ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-300">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">No past discussions</p>
                    <p className="text-[10px] font-medium text-gray-300 leading-tight">Your healing journey starts with a single message.</p>
                </div>
            ) : (
                sessions.map(s => (
                    <div
                        key={s.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                            setActiveSessionId(s.id);
                            setIsSidebarOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setActiveSessionId(s.id);
                            setIsSidebarOpen(false);
                          }
                        }}
                        className={`w-full p-4 rounded-2xl flex items-center justify-between group transition-all text-left cursor-pointer ${activeSessionId === s.id ? 'bg-primary/5 border border-primary/10' : 'hover:bg-gray-50 border border-transparent'}`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeSessionId === s.id ? 'text-primary' : 'text-gray-400'}`} />
                            <span className={`text-xs font-bold truncate ${activeSessionId === s.id ? 'text-gray-900' : 'text-gray-500'}`}>
                                {s.title}
                            </span>
                        </div>
                        <button
                          onClick={(e) => deleteSession(s.id, e)}
                          className={`p-2 -mr-2 rounded-xl transition-all flex items-center gap-1 ${
                            deletingSessionId === s.id 
                            ? 'bg-rose-500 text-white scale-110 shadow-lg' 
                            : 'text-gray-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 focus:opacity-100'
                          }`}
                          title={deletingSessionId === s.id ? "Click again to confirm" : "Delete Chat"}
                          aria-label={deletingSessionId === s.id ? "Confirm Delete" : "Delete Discussion"}
                        >
                          {deletingSessionId === s.id ? (
                            <span className="text-[8px] font-black uppercase tracking-tighter px-1">Confirm</span>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                    </div>
                ))
            )}
          </div>
        </Card>
      </div>

      <Card className="flex-1 flex flex-col p-0 overflow-hidden shadow-2xl relative">
        {/* Chat Header */}
        <div className="p-6 border-b flex items-center justify-between bg-primary text-white">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-white/10 rounded-lg">
                <Menu className="w-5 h-5 text-white" />
            </button>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">MindCare Assistant</h2>
              <div className="flex items-center gap-1.5 opacity-80 text-sm font-medium">
                {historyLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Syncing session...
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    {sessions.find(s => s.id === activeSessionId)?.title || 'Personal Assistant'}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAiSpeaking && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 p-1 bg-white/10 rounded-full pr-4 text-white border border-white/20"
              >
                <button 
                  onClick={() => {
                    speechAbortController.current = true;
                    window.speechSynthesis.cancel();
                    setIsAiSpeaking(false);
                  }}
                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"
                  title="Stop AI Speaking"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-tighter leading-none opacity-60">AI Voice</span>
                  <span className="text-[10px] font-bold leading-none">Stop Speaking</span>
                </div>
              </motion.div>
            )}
            <button 
                onClick={() => {
                    const newHandsFree = !isHandsFree;
                    setIsHandsFree(newHandsFree);
                    if (newHandsFree) {
                        setIsSpeaking(true);
                        startListening();
                    } else {
                        stopListening();
                    }
                }} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-black uppercase tracking-wider ${isHandsFree ? 'bg-white text-primary shadow-lg scale-105' : 'bg-white/10 text-white border border-white/20'}`}
                title={isHandsFree ? "Disable Hands-free Mode" : "Enable Hands-free Mode"}
            >
                {isHandsFree ? (
                    <>
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        Voice Mode
                    </>
                ) : (
                    <>
                        <Mic className="w-3 h-3" />
                        Voice Mode
                    </>
                )}
            </button>

            {/* Voice Selection Toggle */}
            <div className="relative">
              <button 
                onClick={() => setIsVoiceMenuOpen(!isVoiceMenuOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-black uppercase tracking-wider bg-white/10 text-white border border-white/20 hover:bg-white/20`}
                title="Select Soothing Voice"
              >
                <Sparkles className="w-3 h-3" />
                {selectedVoiceName ? 'Voice: ' + selectedVoiceName.split(' ')[0] : 'Choose Voice'}
              </button>

              <AnimatePresence>
                {isVoiceMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl p-2 z-[60] border border-gray-100"
                  >
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b mb-1">
                      Voice Persona
                    </div>
                    <div className="grid grid-cols-3 gap-1 p-1 mb-2">
                       {(['warm', 'gentle', 'calm'] as const).map(p => (
                         <button
                           key={p}
                           onClick={() => {
                             updateVoicePersona(p);
                           }}
                           className={`py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${voicePersona === p ? 'bg-primary text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                         >
                           {p}
                         </button>
                       ))}
                    </div>
                    <button 
                      onClick={previewVoice}
                      className="w-full flex items-center justify-center gap-2 py-2 mb-2 bg-secondary text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-all border border-primary/10"
                    >
                      <Volume2 className="w-3 h-3" />
                      Preview Tone
                    </button>
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b mb-1">
                      Available Narrators
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {availableVoices.length > 0 ? (
                        availableVoices.map((v) => (
                          <button
                            key={v.name}
                            onClick={() => {
                              setSelectedVoiceName(v.name);
                              setIsVoiceMenuOpen(false);
                            }}
                            className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-0.5 hover:bg-primary/5 group ${selectedVoiceName === v.name ? 'bg-primary/10' : ''}`}
                          >
                            <span className={`text-xs font-bold ${selectedVoiceName === v.name ? 'text-primary' : 'text-gray-700'}`}>
                              {v.name.split(' - ')[0]}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {v.lang} • {v.localService ? 'Natural' : 'Digital'}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-gray-400 italic">
                          No high-quality voices found in browser
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => {
                const newSpeaking = !isSpeaking;
                setIsSpeaking(newSpeaking);
                if (!newSpeaking) {
                    window.speechSynthesis.cancel();
                    setIsAiSpeaking(false);
                }
              }} 
              className={`p-2 rounded-lg transition-colors ${isSpeaking ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-200'}`}
              title={isSpeaking ? "Mute AI Voice" : "Unmute AI Voice"}
            >
              {isSpeaking ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <div className="hidden md:flex flex-col items-end opacity-60 text-xs font-bold uppercase tracking-widest">
              <span>Confidential</span>
              <span>Empathetic AI</span>
            </div>
          </div>
        </div>

        {/* Messages Layout */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-gray-50/30"
        >
          <AnimatePresence>
            {showCrisisAlert && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-6 bg-red-50 border-2 border-red-200 rounded-3xl"
              >
                <div className="flex items-center gap-3 text-red-600 mb-2 font-bold uppercase tracking-widest text-xs">
                  <AlertTriangle className="w-5 h-5" />
                  Emergency Help Detected
                </div>
                <p className="text-red-700 font-bold text-lg mb-4 leading-tight">
                  You are not alone. Please reach out to one of these free helplines right now:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-2xl border border-red-100 flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Tele Manas (Govt)</span>
                    <span className="text-primary font-mono font-bold leading-tight">14416 / 1-800-891-4416</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-red-100 flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Vandrevala Support</span>
                    <span className="text-primary font-mono font-bold leading-tight">+91 9999 666 555</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl border border-red-100 flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase">AASRA Support</span>
                    <span className="text-primary font-mono font-bold leading-tight">022-27546669 / 7382053730</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-6 w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setShowCrisisAlert(false)}
                >
                  Dismiss Alert
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-start gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-xl bg-white text-primary border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white border rounded-tl-none shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-lg">
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-900">{loadingMessages[loadingMessageIndex]}</span>
                      <span className="text-[10px] text-gray-400 font-medium">Refining response...</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center p-10">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-primary/40" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">How can I support you today?</h3>
              <p className="text-gray-500 max-w-md font-medium leading-relaxed">
                Whether you're feeling stressed, happy, or just need to talk, I'm here to listen and help you find your center.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-8">
                {['I feel anxious', 'Breathing exercises', 'Need someone to talk', 'Feeling lonely'].map(q => (
                  <button 
                    key={q} 
                    onClick={() => {
                        setInput(q);
                    }}
                    className="px-4 py-2 bg-white border border-gray-100 rounded-full text-sm font-bold text-primary hover:border-primary transition-all shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
              
              <div className="mt-12 pt-12 border-t border-gray-100 w-full max-w-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  {user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' ? 'Verify Account to Start' : 'Or Start Fresh'}
                </p>
                <button 
                  onClick={createNewSession}
                  className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl font-bold transition-all shadow-lg ${
                    user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password'
                    ? 'bg-amber-100 text-amber-700 cursor-not-allowed'
                    : 'bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' ? <ShieldAlert className="w-5 h-5" /> : <MessageSquarePlus className="w-5 h-5" />}
                  {user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' ? 'Unlock Chat' : 'New Conversation'}
                </button>
                {user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' && (
                  <p className="mt-3 text-[10px] font-medium text-amber-600">
                    Check your email for the verification link.
                  </p>
                )}
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${
                    m.role === 'user' ? 'bg-primary text-white' : 'bg-white text-primary border border-primary/20'
                  }`}>
                    {m.role === 'user' ? <User className="w-4 h-4" /> : (
                        isAiSpeaking && i === messages.length - 1 ? (
                            <div className="flex gap-0.5 items-end h-3">
                                <div className="w-1 bg-primary rounded-full animate-[bounce_0.6s_ease-in-out_infinite]" />
                                <div className="w-1 bg-primary rounded-full animate-[bounce_0.6s_ease-in-out_0.2s_infinite]" />
                                <div className="w-1 bg-primary rounded-full animate-[bounce_0.6s_ease-in-out_0.4s_infinite]" />
                            </div>
                        ) : <Brain className="w-4 h-4" />
                    )}
                  </div>
                  <div className={`p-4 rounded-2xl ${
                    m.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20' 
                      : 'bg-white border rounded-tl-none shadow-sm'
                  }`}>
                    <div className={`prose prose-sm font-medium leading-relaxed ${m.role === 'user' ? 'text-white' : 'text-gray-700'}`}>
                       <Markdown>{m.parts[0].text}</Markdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-start gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-xl bg-white text-primary border border-primary/20 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-white border rounded-tl-none shadow-sm flex flex-col gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-primary/30 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-primary/30 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-primary/30 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 animate-pulse">
                    {loadingStep || 'AI is thinking...'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t">
          <div className="relative flex items-end gap-3">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <div className="flex-1 relative flex flex-col gap-1">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                maxLength={2000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isListening ? "Listening..." : "Type your message here..."}
                className="w-full bg-gray-50 rounded-2xl px-6 py-4 pr-16 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none border border-transparent focus:border-primary/20 transition-all font-medium resize-none max-h-48 scrollbar-hide"
              />
              <div className="flex justify-between items-center px-2">
                <span className={`text-[9px] font-black uppercase tracking-widest ${input.length > 1800 ? 'text-red-400' : 'text-gray-300'}`}>
                  {input.length} / 2000
                </span>
                {loading && (
                   <span className="text-[9px] font-black uppercase tracking-widest text-primary animate-pulse">
                     AI is thinking...
                   </span>
                )}
              </div>
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 top-2 p-3 bg-primary text-white rounded-xl shadow-lg disabled:opacity-50 disabled:scale-95 transition-all hover:bg-primary/90 active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-2">
            AI Assistant may provide helpful suggestions but is not a substitute for clinical advice.
          </p>
        </form>
      </Card>
      
      {/* Scroll Down Hint */}
      <div className="absolute right-8 bottom-32">
        <button onClick={scrollToBottom} className="p-3 bg-white border border-gray-100 rounded-full shadow-lg hover:bg-gray-50 transition-all">
          <ArrowDown className="w-5 h-5 text-primary" />
        </button>
      </div>
    </div>
  );
};

export default Chat;

import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, SectionTitle } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import { analyzeSentiment } from '../services/gemini';
import { 
  Smile, 
  Meh, 
  Frown, 
  AlertCircle, 
  Angry, 
  Zap, 
  Moon, 
  Book,
  CheckCircle2,
  AlertTriangle,
  Droplets,
  CloudLightning,
  Loader2,
  RefreshCcw,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const moods = [
  { id: 'happy', icon: Smile, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'neutral', icon: Meh, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'sad', icon: Frown, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 'anxious', icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'angry', icon: Angry, color: 'text-red-500', bg: 'bg-red-50' },
];

const Tracker: React.FC = () => {
  const { user } = useAuth();
  const [mood, setMood] = useState<string>('');
  const [energy, setEnergy] = useState<number>(5);
  const [sleep, setSleep] = useState<number>(7);
  const [water, setWater] = useState<number>(1);
  const [journal, setJournal] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [riskAlert, setRiskAlert] = useState(false);
  const [liveSentiment, setLiveSentiment] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sentimentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save logic
  useEffect(() => {
    if (!user || !journal || submitted || loading) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const q = query(
          collection(db, 'users', user.uid, 'logs'),
          where('date', '==', today),
          limit(1)
        );
        const snapshot = await getDocs(q);
        
        const logData = {
          journalEntry: journal,
          updatedAt: serverTimestamp(),
          // Ensure we don't overwrite mood/sleep if they were already set manually
          mood: mood || 'neutral',
          energy: Number(energy) || 5,
          sleepHours: Number(sleep) || 7,
          waterIntake: Number(water) || 0
        };

        if (!snapshot.empty) {
          await updateDoc(snapshot.docs[0].ref, {
            journalEntry: journal,
            updatedAt: serverTimestamp()
          });
        } else {
          await addDoc(collection(db, 'users', user.uid, 'logs'), {
            ...logData,
            userId: user.uid,
            date: today,
            createdAt: serverTimestamp()
          });
        }
        setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.error("Auto-save failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, 5000); // 5 second idle save

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [journal, user, submitted, loading]); // Remove mood/energy from deps to only save on text typing or user change

  // Live Sentiment Analysis
  useEffect(() => {
    if (!journal || journal.length < 20) {
      setLiveSentiment(null);
      return;
    }

    if (sentimentTimeoutRef.current) clearTimeout(sentimentTimeoutRef.current);

    sentimentTimeoutRef.current = setTimeout(async () => {
      setIsAnalyzing(true);
      try {
        const sentiment = await analyzeSentiment(journal);
        setLiveSentiment(sentiment);
      } catch (err) {
        console.error("Sentiment analysis failed:", err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500);

    return () => {
      if (sentimentTimeoutRef.current) clearTimeout(sentimentTimeoutRef.current);
    };
  }, [journal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !mood) return;

    if (!user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      let sentimentData = liveSentiment;
      if (journal.trim() && !sentimentData) {
        sentimentData = await analyzeSentiment(journal);
      }
      
      if (sentimentData?.riskDetected) {
        setRiskAlert(true);
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          riskLevel: 'critical',
          lastCheckedAt: serverTimestamp()
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, 'users', user.uid, 'logs'),
        where('date', '==', today),
        limit(1)
      );
      const snapshot = await getDocs(q);

      const logData = {
        userId: user.uid,
        date: today,
        mood,
        energy: Number(energy) || 0,
        sleepHours: Number(sleep) || 0,
        waterIntake: Number(water) || 0,
        journalEntry: journal,
        sentiment: sentimentData,
        createdAt: serverTimestamp()
      };

      if (!snapshot.empty) {
        await updateDoc(snapshot.docs[0].ref, logData);
      } else {
        await addDoc(collection(db, 'users', user.uid, 'logs'), logData);
      }
      
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-500 shadow-xl shadow-green-100">
            <CheckCircle2 className="w-12 h-12" />
          </div>
        </motion.div>
        <h2 className="text-4xl font-bold mb-4">Well done, {user?.displayName}!</h2>
        <p className="text-xl text-gray-500 mb-10 font-medium">Your thoughts have been safely recorded. How do you feel now?</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => window.location.hash = '/dashboard'}>Go to Dashboard</Button>
          <Button variant="outline" onClick={() => setSubmitted(false)}>Log another entry</Button>
        </div>

        {riskAlert && (
          <div className="mt-12 p-8 bg-red-50 border-2 border-red-200 rounded-3xl text-left">
            <div className="flex items-center gap-4 mb-4 text-red-600">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-2xl font-bold">Important Notice</h3>
            </div>
            <p className="text-red-700 font-medium mb-6">
              Our AI detected some distressing patterns in your journal. Please know that you are not alone and help is available.
            </p>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-100">
                <p className="font-bold text-gray-800">Vandrevala Foundation (24/7)</p>
                <p className="text-primary text-xl font-mono">1860-266-2345</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-100">
                <p className="font-bold text-gray-800">iCall Psychosocial Helpline</p>
                <p className="text-primary text-xl font-mono">9152987821</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-6 bg-amber-50 border border-amber-200 rounded-[32px] flex items-center gap-4 text-amber-800 shadow-sm"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h4 className="font-black uppercase text-xs tracking-widest mb-1">Attention: Verification Required</h4>
            <p className="text-sm font-medium opacity-80">Check your inbox for a verification link. You need to verify your email to save journal entries and track progress.</p>
          </div>
        </motion.div>
      )}
      <SectionTitle 
        title="Check-in with yourself" 
        subtitle="How was your day? Take a moment to reflect and track your progress." 
      />

      <form onSubmit={handleSubmit} className={`space-y-8 ${user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' ? 'opacity-50 pointer-events-none' : ''}`}>
        <Card className="p-8">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">1</span>
            How are you feeling right now?
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {moods.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id)}
                className={`flex flex-col items-center gap-3 p-6 rounded-3xl transition-all border-2 ${
                  mood === m.id ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-transparent hover:bg-gray-50 bg-gray-50/50'
                }`}
              >
                <m.icon className={`w-10 h-10 ${m.color}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{m.id}</span>
              </button>
            ))}
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">2</span>
              Energy Level
            </h3>
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-6 w-full">
                <Zap className="w-6 h-6 text-orange-400" />
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energy || 0}
                  onChange={(e) => setEnergy(parseInt(e.target.value) || 0)}
                  className="w-full accent-primary h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-2xl font-black text-primary w-8 text-center">{energy}</span>
              </div>
              <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Low • High</p>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">3</span>
              Sleep (Hrs)
            </h3>
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-6 w-full">
                <Moon className="w-6 h-6 text-indigo-400" />
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={sleep || 0}
                  onChange={(e) => setSleep(parseFloat(e.target.value) || 0)}
                  className="w-full p-4 bg-gray-50 rounded-2xl font-black text-2xl text-center focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Hours of rest</p>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600 text-sm font-bold">4</span>
              Water (L)
            </h3>
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-6 w-full">
                <Droplets className="w-6 h-6 text-cyan-400" />
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={water || 0}
                  onChange={(e) => setWater(parseFloat(e.target.value) || 0)}
                  className="w-full p-4 bg-gray-50 rounded-2xl font-black text-2xl text-center focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Liters today</p>
            </div>
          </Card>
        </div>

        <Card className="p-8 relative">
          <div className="absolute top-8 right-8 flex items-center gap-4">
            <AnimatePresence mode="wait">
              {isSaving ? (
                <motion.div 
                  key="saving"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 text-primary font-bold transition-all"
                >
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Saving Draft...</span>
                </motion.div>
              ) : lastSaved ? (
                <motion.div 
                  key="saved"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-green-500 opacity-60"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Saved {lastSaved}
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-sm font-bold">5</span>
            Journal Entry
          </h3>
          <div className="relative">
            <Book className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
            <textarea
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="What's on your mind? Don't worry about being perfect, just write..."
              className="w-full min-h-[250px] pl-12 pr-6 py-6 bg-gray-50 rounded-[40px] border-transparent focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-lg leading-relaxed shadow-inner"
            />
          </div>
          
          <AnimatePresence>
            {journal.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-100"
              >
                <div className="flex flex-col gap-2">
                   <div className="flex items-center gap-2">
                      <CloudLightning className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live AI Insight</span>
                   </div>
                   {isAnalyzing ? (
                     <div className="flex items-center gap-2 text-primary font-medium animate-pulse">
                       <Loader2 className="w-4 h-4 animate-spin" />
                       <span>Analyzing your thoughts...</span>
                     </div>
                   ) : liveSentiment ? (
                     <div className="flex items-center gap-3">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                          liveSentiment.label === 'positive' ? 'bg-green-100 text-green-700' : 
                          liveSentiment.label === 'negative' ? 'bg-rose-100 text-rose-700' : 
                          'bg-indigo-100 text-indigo-700'
                        }`}>
                          {liveSentiment.label} mood detected
                        </span>
                        {liveSentiment.riskDetected && (
                          <span className="flex items-center gap-1.5 text-rose-600 font-bold text-xs animate-bounce">
                            <AlertTriangle className="w-4 h-4" /> Sensitive topics detected
                          </span>
                        )}
                     </div>
                   ) : (
                     <span className="text-gray-300 text-xs font-medium italic">Keep writing for live analysis...</span>
                   )}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {journal.split(' ').filter(word => word.length > 0).length} Words | {journal.length} chars
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <div className="flex justify-end pt-4">
          <Button size="lg" type="submit" loading={loading} className="px-12 py-5 rounded-2xl text-lg shadow-2xl">
            Save Entry
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Tracker;

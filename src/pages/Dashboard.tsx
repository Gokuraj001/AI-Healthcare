import React, { useEffect, useState } from 'react';
import { Card, Button } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { generateWellnessPlan, WellnessPlan } from '../services/gemini';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, where, doc, setDoc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  MessageSquare, 
  Phone, 
  Gamepad2, 
  UserCircle2, 
  TrendingUp, 
  AlertCircle,
  ArrowRight,
  Smile,
  Meh,
  Frown,
  Angry,
  Sparkles,
  CheckCircle2,
  Heart,
  Dumbbell,
  Coffee,
  Brain,
  Salad,
  Sunrise,
  Sun,
  Moon,
  Loader2,
  X,
  Film,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { format } from 'date-fns';

const moodScores: { [key: string]: number } = {
  'angry': 1,
  'anxious': 2,
  'sad': 3,
  'neutral': 4,
  'happy': 5
};

const stories = [
  {
    name: "Sarah Jenkins",
    handle: "@sarahj_wins",
    photo: "https://i.pravatar.cc/150?u=sarahj",
    story: "After losing my job, I fell into a deep depression. Focusing on small daily wins and regular mental check-ins helped me find my light again at my own pace."
  },
  {
    name: "Michael Chen",
    handle: "@mchen_zen",
    photo: "https://i.pravatar.cc/150?u=michaelc",
    story: "Anxiety used to keep me indoors for weeks. The mindfulness tools and games here gave me a safe space to practice grounding until I could face the world again."
  },
  {
    name: "Emily Rodriguez",
    handle: "@emily_r_hope",
    photo: "https://i.pravatar.cc/150?u=emilyr",
    story: "Loneliness was my silent enemy. Accessing professional help through this platform showed me that recovery isn't just possible—it's waiting for all of us."
  },
  {
    name: "David Kim",
    handle: "@dk_resilient",
    photo: "https://i.pravatar.cc/150?u=davidk",
    story: "I struggled with intense panic attacks for years. Learning to track my triggers and talking to the AI assistant helped me understand my patterns and regain control."
  }
];

const Dashboard: React.FC = () => {
  const { user, userData } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resilienceStories, setResilienceStories] = useState<any[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodSaved, setMoodSaved] = useState(false);
  const [planLoadingStep, setPlanLoadingStep] = useState('');
  const [emojiIndex, setEmojiIndex] = useState(0);
  const [wellnessPlan, setWellnessPlan] = useState<WellnessPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState<{
    segment: 'Morning' | 'Afternoon' | 'Evening';
    icon: React.ReactNode;
    color: string;
    items: { title: string; desc: string; detail: string; label: string; icon: React.ReactNode; videoUrl?: string; articleUrl?: string }[];
  } | null>(null);
  
  const happyEmojis = ['😊', '🌟', '✨', '🌈', '🌻', '🦋', '☘️', '☀️', '🥰', '🎈'];

  useEffect(() => {
    const fetchResilience = async () => {
      try {
        const q = query(collection(db, 'resilienceStories'), limit(4));
        const snapshot = await getDocs(q);
        const storiesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (storiesList.length > 0) {
          setResilienceStories(storiesList);
        }
      } catch (err) {
        console.error("Failed to fetch stories", err);
      }
    };
    fetchResilience();

    const interval = setInterval(() => {
      setEmojiIndex((prev) => (prev + 1) % happyEmojis.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'logs'),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => doc.data());
    setLogs(data.reverse());
    setLoading(false);

    // After fetching logs, check if we have a mood for today to generate/load plan
    const latestMood = data[data.length - 1]?.mood;
    if (latestMood) {
      loadOrGeneratePlan(latestMood);
    }
  };

  const loadOrGeneratePlan = async (mood: string, force = false) => {
    if (!user) return;
    setPlanLoading(true);
    setPlanLoadingStep('Connecting to AI Sanctuary...');

    const today = new Date().toISOString().split('T')[0];
    const planRef = doc(db, 'users', user.uid, 'plans', today);
    
    try {
      if (!force) {
        setPlanLoadingStep('Retrieving existing plan...');
        const planDoc = await getDoc(planRef);
        if (planDoc.exists()) {
          setWellnessPlan(planDoc.data() as WellnessPlan);
          setPlanLoading(false);
          return;
        }
      }

      // Generate new plan
      setPlanLoadingStep('Analyzing your mood profile...');
      await new Promise(r => setTimeout(r, 800));
      setPlanLoadingStep('Optimizing nutrition and activity...');
      const newPlan = await generateWellnessPlan(mood, userData);
      setPlanLoadingStep('Finalizing your wellness schedule...');
      await setDoc(planRef, {
        ...newPlan,
        generatedAt: serverTimestamp(),
        moodAtGeneration: mood
      });
      setWellnessPlan(newPlan);
    } catch (err) {
      console.error("Error with wellness plan:", err);
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const handleMoodRate = async (mood: string) => {
    if (!user || moodSaved) return;

    if (!user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSelectedMood(mood);
    setMoodSaved(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, 'users', user.uid, 'logs'), {
        mood,
        date: today,
        createdAt: serverTimestamp(),
        userId: user.uid,
        energy: 5,
        sleepHours: 7,
        journalEntry: '',
        sentiment: { label: mood === 'happy' ? 'positive' : mood === 'sad' || mood === 'angry' ? 'negative' : 'neutral' }
      });
      fetchLogs(); // Refresh chart and triggers plan update
      loadOrGeneratePlan(mood, true); // Force regenerate for new mood
    } catch (err) {
      console.error(err);
    }
  };

  const trendData = logs.map(log => ({
    date: format(log.createdAt?.toDate ? log.createdAt.toDate() : new Date(log.createdAt), 'MMM d'),
    score: moodScores[log.mood] || 3,
  }));

  const MoodEmoji = ({ mood, active, onClick }: { mood: string, active: boolean, onClick: () => void }) => {
    const icons: any = {
      happy: <Smile className={`w-8 h-8 ${active ? 'text-green-500' : 'text-gray-400'}`} />,
      neutral: <Meh className={`w-8 h-8 ${active ? 'text-yellow-500' : 'text-gray-400'}`} />,
      sad: <Frown className={`w-8 h-8 ${active ? 'text-indigo-500' : 'text-gray-400'}`} />,
      angry: <Angry className={`w-8 h-8 ${active ? 'text-red-500' : 'text-gray-400'}`} />
    };

    return (
      <button 
        onClick={onClick}
        disabled={moodSaved}
        className={`p-4 rounded-2xl transition-all ${active ? 'bg-white shadow-lg scale-110' : 'hover:bg-gray-50'}`}
      >
        {icons[mood]}
        <span className="block text-[10px] font-black uppercase tracking-widest mt-2 opacity-60 capitalize">{mood}</span>
      </button>
    );
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header section */}
      <header className="mb-16 text-center">
        {user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center gap-3 text-amber-800"
          >
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <p className="text-sm font-medium">Please verify your email to unlock all features including Chat and Daily Insights.</p>
          </motion.div>
        )}
        <motion.div
           initial={{ scale: 0.5, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ type: 'spring', damping: 12 }}
           className="text-7xl mb-6 inline-block"
        >
          <AnimatePresence mode="wait">
             <motion.span
                key={emojiIndex}
                initial={{ y: 20, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="inline-block"
             >
               {happyEmojis[emojiIndex]}
             </motion.span>
          </AnimatePresence>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-black text-gray-900 tracking-tight mb-4"
        >
          Welcome, {user?.displayName?.split(' ')[0]}
        </motion.h1>
        <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">
          It's a beautiful day to take care of your mind. We're here to listen and help you through every step.
        </p>
      </header>

      {/* Primary Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Rate Mood */}
        <Card className={`p-8 bg-gradient-to-br from-indigo-50 to-blue-50 border-none shadow-sm relative overflow-hidden ${user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' ? 'opacity-70 grayscale-[0.5]' : ''}`}>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            Rate your today's mood
            {user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' && <ShieldAlert className="w-4 h-4 text-amber-600 ml-auto" />}
          </h2>
          <div className="flex justify-between items-center max-w-sm mx-auto">
            {['happy', 'neutral', 'sad', 'angry'].map((m) => (
              <MoodEmoji 
                key={m} 
                mood={m} 
                active={selectedMood === m} 
                onClick={() => handleMoodRate(m)} 
              />
            ))}
          </div>
          <AnimatePresence>
            {moodSaved && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 text-center"
              >
                 <div className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                   <CheckCircle2 className="w-4 h-4" />
                   Mood Logged Successfully
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* AI Consultation */}
        <Card className="p-8 bg-primary text-white border-none shadow-xl hover:shadow-2xl transition-all cursor-pointer group" onClick={() => window.location.hash = '/chat'}>
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black mb-4 group-hover:translate-x-2 transition-transform">Start your AI consultation</h2>
              <p className="text-primary-foreground/80 font-medium text-lg leading-relaxed">Let's talk about what's on your mind. Your AI guide is ready whenever you need a safe space.</p>
            </div>
            <div className="flex justify-end mt-8">
              <Button variant="outline" className="bg-white/10 border-white/20 hover:bg-white text-white hover:text-primary transition-all rounded-2xl px-8 h-14 text-lg">
                Talk Now
                <ArrowRight className="ml-3 w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Support & Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {/* Emergency Help */}
        <Card className="p-8 border-none bg-rose-50 shadow-sm">
          <h3 className="text-xl font-black text-rose-900 mb-6 flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            Talk to Someone
          </h3>
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Standard Helpline</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-rose-700">+91 9999 666 555</span>
                <Phone className="w-5 h-5 text-rose-500" />
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-rose-100">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Crisis Support</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-rose-700">+91 9999 666 555</span>
                <MessageSquare className="w-5 h-5 text-rose-500" />
              </div>
            </div>
            <p className="text-xs font-medium text-rose-600 italic">Professional counsellors are available 24/7 at this number.</p>
          </div>
        </Card>

        {/* Zen Zone Redirection */}
        <Card 
          className="p-8 bg-gradient-to-br from-violet-500 to-indigo-600 text-white border-none shadow-lg hover:-translate-y-1 transition-all cursor-pointer"
          onClick={() => window.location.hash = '/zen-zone'}
        >
          <Gamepad2 className="w-12 h-12 mb-6" />
          <h3 className="text-2xl font-black mb-4">Stress Buster Game section</h3>
          <p className="text-white/80 font-medium mb-8">Reduce your cortisol levels with interactive calming games designed for focus and relaxation.</p>
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            Enter Zen Zone <ArrowRight className="w-4 h-4" />
          </div>
        </Card>

        {/* Professionals Redirection */}
        <Card 
          className="p-8 bg-white shadow-sm hover:shadow-xl transition-all cursor-pointer group"
          onClick={() => window.location.hash = '/find-help'}
        >
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <UserCircle2 className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-4">Consult from Psychiatrist</h3>
          <p className="text-gray-500 font-medium mb-8">Connect with certified mental health professionals near you for personalized care and guidance.</p>
          <div className="flex items-center gap-2 text-sm font-black text-primary uppercase tracking-widest">
            Find Professionals <ArrowRight className="w-4 h-4" />
          </div>
        </Card>
      </div>
      
      {/* AI Wellness Schedule Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Your AI Wellness Plan</h3>
                <p className="text-gray-500 font-medium tracking-tight">Tailored schedule based on your recent activity and {selectedMood || logs[logs.length-1]?.mood || 'current'} mood.</p>
              </div>
           </div>
           <Button 
            variant="outline" 
            disabled={planLoading}
            onClick={() => loadOrGeneratePlan(selectedMood || logs[logs.length-1]?.mood || 'neutral', true)}
            className="hidden md:flex rounded-full border-primary/20 text-primary font-bold hover:bg-primary/5"
           >
              {planLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Refresh Plan
           </Button>
        </div>

        {planLoading && !wellnessPlan ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <Card key={i} className="p-8 border-none bg-gray-50/50 flex flex-col items-center justify-center h-64 rounded-[40px] relative overflow-hidden">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">{planLoadingStep}</p>
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Morning Plan */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={() => wellnessPlan && setSelectedPlanDetail({
                segment: 'Morning',
                icon: <Sunrise />,
                color: 'orange',
                items: [
                  { label: 'Exercise', icon: <Dumbbell />, ...wellnessPlan.morning.exercise },
                  { 
                    label: 'Nutrition', 
                    icon: <Coffee />, 
                    ...wellnessPlan.morning.nutrition,
                    articleUrl: 'https://www.healthline.com/health/food-nutrition/benefits-of-lemon-water'
                  }
                ]
              })}
              className="group cursor-pointer"
            >
              <Card className="p-8 border-none bg-orange-50/50 hover:bg-white transition-all shadow-sm hover:shadow-xl rounded-[40px] h-full relative overflow-hidden">
                {planLoading && <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-orange-100 rounded-2xl text-orange-600">
                    <Sunrise className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Morning: Activate</h4>
                </div>
                
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="mt-1 w-10 h-10 rounded-xl bg-white border flex items-center justify-center shrink-0">
                      <Dumbbell className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-1">Exercise</p>
                      <p className="text-gray-700 font-bold">{wellnessPlan?.morning.exercise.title || 'Gentle Movement'}</p>
                      <p className="text-sm text-gray-500 font-medium">{wellnessPlan?.morning.exercise.desc || 'Start your day with some light stretching.'}</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="mt-1 w-10 h-10 rounded-xl bg-white border flex items-center justify-center shrink-0">
                      <Coffee className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-1">Nutrition</p>
                      <p className="text-gray-700 font-bold">{wellnessPlan?.morning.nutrition.title || 'Hydration'}</p>
                      <p className="text-sm text-gray-500 font-medium">{wellnessPlan?.morning.nutrition.desc || 'A nourishing breakfast to fuel your morning.'}</p>
                    </div>
                  </li>
                </ul>
              </Card>
            </motion.div>

            {/* Afternoon Plan */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              onClick={() => wellnessPlan && setSelectedPlanDetail({
                segment: 'Afternoon',
                icon: <Sun />,
                color: 'sky',
                items: [
                  { label: 'Activity', icon: <Brain />, ...wellnessPlan.afternoon.activity },
                  { 
                    label: 'Nutrition', 
                    icon: <Salad />, 
                    ...wellnessPlan.afternoon.nutrition,
                    articleUrl: 'https://www.healthline.com/nutrition/9-proven-benefits-of-almonds'
                  }
                ]
              })}
              className="group cursor-pointer"
            >
              <Card className="p-8 border-none bg-sky-50/50 hover:bg-white transition-all shadow-sm hover:shadow-xl rounded-[40px] h-full relative overflow-hidden">
                {planLoading && <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10"><Loader2 className="w-6 h-6 animate-spin text-sky-500" /></div>}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-sky-100 rounded-2xl text-sky-600">
                    <Sun className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Afternoon: Focus</h4>
                </div>
                
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="mt-1 w-10 h-10 rounded-xl bg-white border flex items-center justify-center shrink-0">
                      <Brain className="w-5 h-5 text-gray-400 group-hover:text-sky-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-sky-600 uppercase tracking-widest mb-1">Activity</p>
                      <p className="text-gray-700 font-bold">{wellnessPlan?.afternoon.activity.title || 'Mental Break'}</p>
                      <p className="text-sm text-gray-500 font-medium">{wellnessPlan?.afternoon.activity.desc || 'A short activity to reset your focus.'}</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="mt-1 w-10 h-10 rounded-xl bg-white border flex items-center justify-center shrink-0">
                      <Salad className="w-5 h-5 text-gray-400 group-hover:text-sky-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-sky-600 uppercase tracking-widest mb-1">Nutrition</p>
                      <p className="text-gray-700 font-bold">{wellnessPlan?.afternoon.nutrition.title || 'Balanced Lunch'}</p>
                      <p className="text-sm text-gray-500 font-medium">{wellnessPlan?.afternoon.nutrition.desc || 'Keep your energy levels stable.'}</p>
                    </div>
                  </li>
                </ul>
              </Card>
            </motion.div>

            {/* Evening Plan */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              onClick={() => wellnessPlan && setSelectedPlanDetail({
                segment: 'Evening',
                icon: <Moon />,
                color: 'indigo',
                items: [
                  { label: 'Mindfulness', icon: <Heart />, ...wellnessPlan.evening.mindfulness },
                  { 
                    label: 'Rest', 
                    icon: <CheckCircle2 />, 
                    ...wellnessPlan.evening.rest,
                    articleUrl: 'https://www.sleepfoundation.org/how-sleep-works/screen-time-and-sleep'
                  }
                ]
              })}
              className="group cursor-pointer"
            >
              <Card className="p-8 border-none bg-indigo-50/50 hover:bg-white transition-all shadow-sm hover:shadow-xl rounded-[40px] h-full relative overflow-hidden">
                {planLoading && <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
                    <Moon className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Evening: Unwind</h4>
                </div>
                
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="mt-1 w-10 h-10 rounded-xl bg-white border flex items-center justify-center shrink-0">
                      <Heart className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Mindfulness</p>
                      <p className="text-gray-700 font-bold">{wellnessPlan?.evening.mindfulness.title || 'Reflection'}</p>
                      <p className="text-sm text-gray-500 font-medium">{wellnessPlan?.evening.mindfulness.desc || 'End your day with some peaceful thoughts.'}</p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="mt-1 w-10 h-10 rounded-xl bg-white border flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Rest</p>
                      <p className="text-gray-700 font-bold">{wellnessPlan?.evening.rest.title || 'Quality Sleep'}</p>
                      <p className="text-sm text-gray-500 font-medium">{wellnessPlan?.evening.rest.desc || 'Prepare your body for restorative sleep.'}</p>
                    </div>
                  </li>
                </ul>
              </Card>
            </motion.div>
          </div>

        )}
      </section>

      {/* Plan Detail Modal */}
      <AnimatePresence>
        {selectedPlanDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlanDetail(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className={`h-3 ${
                selectedPlanDetail.color === 'orange' ? 'bg-orange-500' :
                selectedPlanDetail.color === 'sky' ? 'bg-sky-500' : 'bg-indigo-500'
              }`} />
              <div className="p-8 md:p-12">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${
                      selectedPlanDetail.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                      selectedPlanDetail.color === 'sky' ? 'bg-sky-100 text-sky-600' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      {selectedPlanDetail.icon}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{selectedPlanDetail.segment} Strategy</h2>
                      <p className="text-gray-500 font-medium">Detailed guidance for your mental wellness.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedPlanDetail(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <div className="space-y-10">
                  {selectedPlanDetail.items.map((item, idx) => (
                    <div key={idx} className="flex gap-6">
                      <div className={`mt-1 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shrink-0 ${
                        selectedPlanDetail.color === 'orange' ? 'bg-orange-50 text-orange-500' :
                        selectedPlanDetail.color === 'sky' ? 'bg-sky-50 text-sky-500' : 'bg-indigo-50 text-indigo-500'
                      }`}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            selectedPlanDetail.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                            selectedPlanDetail.color === 'sky' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {item.label}
                          </span>
                          <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                        </div>
                        <p className="text-gray-500 font-medium mb-3">{item.desc}</p>
                        <div className="flex flex-col gap-3">
                          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 italic text-gray-600 font-medium leading-relaxed">
                            "{item.detail}"
                          </div>
                          {(item.videoUrl || item.articleUrl) && (
                            <div className="flex gap-2">
                              {item.videoUrl && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(item.videoUrl, '_blank', 'noopener,noreferrer')}
                                  className={`rounded-xl transition-all flex items-center gap-2 ${
                                    selectedPlanDetail.color === 'orange' ? 'border-orange-200 text-orange-600 bg-orange-50/50 hover:bg-orange-100' :
                                    selectedPlanDetail.color === 'sky' ? 'border-sky-200 text-sky-600 bg-sky-50/50 hover:bg-sky-100' : 
                                    'border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100'
                                  }`}
                                >
                                  <Film className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Watch Demo</span>
                                </Button>
                              )}
                              {item.articleUrl && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(item.articleUrl, '_blank', 'noopener,noreferrer')}
                                  className={`rounded-xl transition-all flex items-center gap-2 ${
                                    selectedPlanDetail.color === 'orange' ? 'border-orange-200 text-orange-600 bg-orange-50/50 hover:bg-orange-100' :
                                    selectedPlanDetail.color === 'sky' ? 'border-sky-200 text-sky-600 bg-sky-50/50 hover:bg-sky-100' : 
                                    'border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100'
                                  }`}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">View Recipe/Guide</span>
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-12 flex justify-end">
                  <Button 
                    className={`rounded-full px-8 h-14 text-lg text-white ${
                      selectedPlanDetail.color === 'orange' ? 'bg-orange-600 hover:bg-orange-700' :
                      selectedPlanDetail.color === 'sky' ? 'bg-sky-600 hover:bg-sky-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                    onClick={() => setSelectedPlanDetail(null)}
                  >
                    Got it, thanks AI Assistant
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mood Tracker Analytics */}
      <Card className="p-8 mb-12 border-none bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-gray-900 mb-1 flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-primary" />
              Mood tracker
            </h3>
            <p className="text-gray-500 font-medium">Your emotional journey over the past month</p>
          </div>
          <span className="text-xs font-black text-gray-400 bg-gray-100 px-4 py-2 rounded-full uppercase tracking-widest">Sync Active</span>
        </div>
        <div className="h-[350px] w-full">
          {logs.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#bbb' }} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#bbb' }} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    padding: '16px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#5A8F7B" 
                  strokeWidth={5} 
                  dot={{ fill: '#5A8F7B', strokeWidth: 3, r: 6, stroke: '#fff' }}
                  activeDot={{ r: 9, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 font-medium italic bg-gray-50 rounded-3xl border border-dashed">
              No mood data yet. Rate your mood above to start tracking.
            </div>
          )}
        </div>
      </Card>

      {/* Community Stories */}
      <section>
        <div className="flex items-center gap-4 mb-8">
          <Heart className="w-8 h-8 text-rose-500" />
          <h3 className="text-3xl font-black text-gray-900 tracking-tight">Voices of Resilience</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {(resilienceStories.length > 0 ? resilienceStories : stories).map((s, i) => (
            <Card key={i} className="p-8 border-none bg-gray-50/50 hover:bg-white transition-all shadow-sm hover:shadow-xl group">
              <div className="flex items-start gap-6 mb-6">
                <div className="relative">
                  <img src={s.photo} alt={s.name} className="w-16 h-16 rounded-full object-cover shadow-inner bg-white border-4 border-white" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-lg">{s.name}</h4>
                  <p className="text-sm font-bold text-primary">{s.handle}</p>
                </div>
              </div>
              <p className="text-gray-600 font-medium leading-relaxed italic text-lg line-clamp-3">
                "{s.content || s.story}"
              </p>
              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Voices of Resilience</span>
                <div className="w-32 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-primary/20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

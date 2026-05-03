import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wind, 
  Trophy, 
  Sparkles, 
  Timer, 
  Play, 
  CheckCircle2, 
  User as UserIcon,
  Circle,
  Zap,
  Flower2,
  AlertCircle,
  Loader2,
  Film,
  Tv,
  Clapperboard,
  X,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { GoogleGenAI } from '@google/genai';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
  increment, 
  addDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { Card, Button } from '../components/UI';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import BubblePopGame from '../components/BubblePopGame';

interface LeaderboardUser {
  id: string;
  displayName: string;
  photoURL: string;
  zenPoints: number;
}

const ZenZone: React.FC = () => {
  const { user } = useAuth();
  const [activeGame, setActiveGame] = useState<'none' | 'breathing' | 'bubbles' | 'yoga' | 'distract' | 'nature'>('none');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [bubbleHighScore, setBubbleHighScore] = useState(0);
  const [breathingCompletions, setBreathingCompletions] = useState(0);
  const [userZenPoints, setUserZenPoints] = useState(0);
  const [profile, setProfile] = useState<{ age?: number; gender?: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch Global Masters Leaderboard (Total Points)
    const q = query(collection(db, 'users'), orderBy('zenPoints', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const topUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeaderboardUser[];
      setLeaderboard(topUsers);
    });

    const userRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserZenPoints(data.zenPoints || 0);
        setBubbleHighScore(data.bubblePopHighScore || 0);
        setBreathingCompletions(data.breathingHighScore || 0);
        setProfile({ age: data.age, gender: data.gender });
      }
    });

    return () => {
      unsubscribe();
      unsubUser();
    };
  }, [user]);

  const addZenPoints = async (points: number, gameType: string) => {
    if (!user) return;
    
    // Silence saving if unverified password user
    if (!user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
      console.log("Zen Points not saved: Verification Required");
      return;
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      const updates: any = {
        zenPoints: increment(points)
      };

      if (gameType === 'bubbles') {
        if (points > bubbleHighScore) {
          updates.bubblePopHighScore = points;
        }
      } else if (gameType === 'breathing') {
        updates.breathingHighScore = increment(1);
      }

      await updateDoc(userRef, updates);
      
      await addDoc(collection(db, 'relaxationSessions'), {
        userId: user.uid,
        type: gameType,
        pointsEarned: points,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users/' + user.uid);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-2">Zen Zone</h1>
          <p className="text-gray-500 font-medium text-lg italic">Relax, recharge, and find your center.</p>
        </div>
        <Card className="p-6 bg-primary text-white border-none shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Your Zen Score</p>
            <p className="text-3xl font-black">{userZenPoints}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {activeGame === 'none' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Yoga Card - Featured */}
              <Card className="md:col-span-2 overflow-hidden group hover:shadow-2xl transition-all border-none bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                <div className="flex flex-col md:flex-row">
                  <div className="p-10 flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">AI Powered</div>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-4xl font-black mb-4">Personalized Yoga</h3>
                    <p className="text-white/80 font-medium mb-8 text-lg">
                      Custom yoga routines generated based on your profile to combat stress and anxiety.
                    </p>
                    <Button 
                      className="h-16 px-12 text-xl bg-white text-purple-600 hover:bg-white/90"
                      onClick={() => setActiveGame('yoga')}
                    >
                      Explore Routine
                    </Button>
                  </div>
                  <div className="w-full md:w-1/3 bg-white/10 flex items-center justify-center p-10 backdrop-blur-sm">
                    <Flower2 className="w-32 h-32 text-white/50 animate-pulse" />
                  </div>
                </div>
              </Card>

              {/* Breathing Exercise Card */}
              <Card className="overflow-hidden group hover:shadow-2xl transition-all border-none">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center p-8">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-24 h-24 rounded-full bg-white/30 backdrop-blur-md border-4 border-white/40"
                  />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-black text-gray-800 mb-2">Rhythmic Breath</h3>
                  <p className="text-gray-500 font-medium mb-6">A guided breathing exercise to lower heart rate and reduce stress.</p>
                  <Button 
                    className="w-full h-14 text-lg"
                    onClick={() => setActiveGame('breathing')}
                  >
                    <Play className="w-5 h-5 mr-2" /> Start Session
                  </Button>
                </div>
              </Card>

              {/* Bubbles Game Card */}
              <Card className="overflow-hidden group hover:shadow-2xl transition-all border-none">
                <div className="h-48 bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center p-8 relative overflow-hidden">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: -100, opacity: [0, 1, 0] }}
                      transition={{ duration: 2 + i, repeat: Infinity, delay: i * 0.5 }}
                      className="absolute w-8 h-8 rounded-full bg-white/20 border border-white/30"
                      style={{ left: `${15 + i * 15}%` }}
                    />
                  ))}
                  <Sparkles className="w-16 h-16 text-white/40 rotate-12" />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-black text-gray-800 mb-2">Bubble Pop</h3>
                  <p className="text-gray-500 font-medium mb-6">Pop floating bubbles to clear your mind. Simple, satisfying, serene.</p>
                  <Button 
                    className="w-full h-14 text-lg"
                    onClick={() => setActiveGame('bubbles')}
                  >
                    <Play className="w-5 h-5 mr-2" /> Play Now
                  </Button>
                </div>
              </Card>

              {/* Distract the Mood Card */}
              <Card className="overflow-hidden group hover:shadow-2xl transition-all border-none bg-gradient-to-br from-amber-400 to-orange-500 text-white relative">
                <div className="absolute top-0 right-0 p-4">
                  <div className="px-2 py-1 bg-white/20 rounded text-[8px] font-black uppercase tracking-widest">Relief</div>
                </div>
                <div className="h-48 flex items-center justify-center p-8">
                  <Clapperboard className="w-24 h-24 text-white/40 group-hover:rotate-12 transition-transform duration-500" />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-black mb-2">Distract the Mood</h3>
                  <p className="text-white/80 font-medium mb-6">Enjoy uplifting movies and series that are guaranteed to bring a smile to your face.</p>
                  <Button 
                    className="w-full h-14 text-lg bg-white text-orange-600 hover:bg-white/90"
                    onClick={() => setActiveGame('distract')}
                  >
                    <Film className="w-5 h-5 mr-2" /> Start Watching
                  </Button>
                </div>
              </Card>

              {/* Nature Meditation Card */}
              <Card className="md:col-span-1 overflow-hidden group hover:shadow-2xl transition-all border-none bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative">
                <div className="absolute top-0 right-0 p-4">
                  <div className="px-2 py-1 bg-white/20 rounded text-[8px] font-black uppercase tracking-widest">Visuals</div>
                </div>
                <div className="h-48 flex items-center justify-center p-8">
                  <Wind className="w-24 h-24 text-white/40 group-hover:animate-[spin_4s_linear_infinite]" />
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-black mb-2">Nature Meditation</h3>
                  <p className="text-white/80 font-medium mb-6">Immerse yourself in high-quality nature visuals designed for deep relaxation.</p>
                  <Button 
                    className="w-full h-14 text-lg bg-white text-emerald-700 hover:bg-white/90"
                    onClick={() => setActiveGame('nature')}
                  >
                    <Tv className="w-5 h-5 mr-2" /> Explore Visuals
                  </Button>
                </div>
              </Card>
            </div>
          ) : activeGame === 'breathing' ? (
            <div className="space-y-8">
              <BreathingGame onComplete={() => { addZenPoints(50, 'breathing'); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} />
              <GameLeaderboard title="Breathing Champions" scoreField="breathingHighScore" scoreLabel="Sessions" />
            </div>
          ) : activeGame === 'bubbles' ? (
            <div className="space-y-8">
              <BubblePopGame onComplete={(points) => { addZenPoints(points, 'bubbles'); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} />
              <GameLeaderboard title="Bubble Pop Legends" scoreField="bubblePopHighScore" scoreLabel="High Score" />
            </div>
          ) : activeGame === 'yoga' ? (
            <YogaGuide 
              age={profile?.age} 
              gender={profile?.gender} 
              onComplete={() => { addZenPoints(100, 'yoga'); setActiveGame('none'); }} 
              onCancel={() => setActiveGame('none')} 
            />
          ) : activeGame === 'nature' ? (
            <NatureMeditation onCancel={() => setActiveGame('none')} />
          ) : (
            <DistractMood onCancel={() => setActiveGame('none')} />
          )}

          {/* Inspirational Quote Card */}
          <Card className="p-12 text-center bg-gray-50 border-none">
            <p className="text-3xl font-serif italic text-gray-400 mb-6 font-medium">
              "Quiet the mind, and the soul will speak."
            </p>
            <div className="w-12 h-1 bg-primary/20 mx-auto rounded-full" />
          </Card>
        </div>

        {/* Leaderboard Column */}
        <div className="space-y-8">
          <Card className="p-8 border-none shadow-xl h-fit">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/30">
                <Trophy className="w-5 h-5 text-yellow-900" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Zen Masters</h2>
            </div>

            <div className="space-y-6">
              {leaderboard.map((lbUser, index) => (
                <div key={lbUser.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-xl overflow-hidden bg-gray-200 border-2 transition-all ${
                        index === 0 ? 'border-yellow-400 scale-110' : 'border-transparent'
                      }`}>
                        {lbUser.photoURL ? (
                          <img src={lbUser.photoURL} alt={lbUser.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-lg ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-600' :
                        index === 2 ? 'bg-orange-300 text-orange-900' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <p className="font-black text-gray-800 text-sm">{lbUser.displayName || 'Member'}</p>
                      <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Zen Level {Math.floor(lbUser.zenPoints / 100)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary text-sm">{lbUser.zenPoints}</p>
                    <p className="text-[8px] uppercase font-black tracking-widest text-gray-300">Points</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const GameLeaderboard: React.FC<{ 
  title: string; 
  scoreField: string; 
  scoreLabel: string;
}> = ({ title, scoreField, scoreLabel }) => {
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const { user } = useAuth();
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users'), orderBy(scoreField, 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTopUsers(users);

      // Simple ranks for top 5
      const index = users.findIndex(u => u.id === user?.uid);
      if (index !== -1) {
        setUserRank(index + 1);
      } else {
        // If not in top 5, we'd need a separate query for rank which is expensive,
        // so we'll just show "Out of Top 5" for now or similar
        setUserRank(null);
      }
    });

    return () => unsubscribe();
  }, [scoreField, user]);

  return (
    <Card className="p-8 border-none shadow-xl bg-white/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{title}</h2>
        </div>
        {userRank && (
          <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
            You are Ranked #{userRank}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {topUsers.map((lbUser, index) => (
          <div key={lbUser.id} className={`flex flex-col items-center p-4 rounded-3xl transition-all ${
            lbUser.id === user?.uid ? 'bg-primary/5 border border-primary/20 scale-105 shadow-xl' : 'bg-white/30'
          }`}>
            <div className="relative mb-3">
              <div className={`w-12 h-12 rounded-2xl overflow-hidden bg-gray-200 border-2 ${
                index === 0 ? 'border-yellow-400' : 
                index === 1 ? 'border-gray-300' : 
                index === 2 ? 'border-orange-300' : 'border-transparent'
              }`}>
                {lbUser.photoURL ? (
                  <img src={lbUser.photoURL} alt={lbUser.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-lg ${
                index === 0 ? 'bg-yellow-400 text-yellow-900' :
                index === 1 ? 'bg-gray-300 text-gray-600' :
                index === 2 ? 'bg-orange-300 text-orange-900' :
                'bg-gray-100 text-gray-400'
              }`}>
                {index + 1}
              </div>
            </div>
            <p className="font-black text-gray-800 text-[10px] truncate w-full text-center mb-1">
              {lbUser.displayName || 'Member'}
            </p>
            <div className="flex flex-col items-center">
              <span className="text-sm font-black text-primary">{lbUser[scoreField] || 0}</span>
              <span className="text-[7px] uppercase font-black tracking-widest text-gray-400">{scoreLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const BreathingGame: React.FC<{ onComplete: () => void; onCancel: () => void }> = ({ onComplete, onCancel }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold-empty'>('inhale');
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute session
  const [counter, setCounter] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    const phaseTimer = setInterval(() => {
      setCounter(prev => {
        if (prev <= 1) return 4;
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(phaseTimer);
    };
  }, []);

  useEffect(() => {
    if (counter === 4) {
      setPhase(current => {
        if (current === 'inhale') return 'hold';
        if (current === 'hold') return 'exhale';
        if (current === 'exhale') return 'hold-empty';
        return 'inhale';
      });
    }
  }, [counter]);

  useEffect(() => {
    if (timeLeft === 0) {
      onComplete();
    }
  }, [timeLeft, onComplete]);

  return (
    <Card className="p-12 flex flex-col items-center justify-center relative overflow-hidden border-none shadow-2xl min-h-[500px] bg-gradient-to-b from-blue-50 to-white">
      <button onClick={onCancel} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 transition-all font-black text-xs uppercase tracking-widest">
        End Early
      </button>

      <div className="text-center mb-12">
        <h2 className="text-4xl font-black text-primary mb-2 uppercase tracking-tight">
          {phase.replace('-', ' ')}
        </h2>
        <div className="flex items-center justify-center gap-2 text-gray-400 font-bold">
          <Timer className="w-4 h-4" />
          <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} remaining</span>
        </div>
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center">
        <motion.div
          animate={{
            scale: phase === 'inhale' ? 1.5 : phase === 'exhale' ? 0.8 : phase === 'hold' ? 1.5 : 0.8,
            backgroundColor: phase === 'inhale' ? '#93c5fd' : phase === 'exhale' ? '#60a5fa' : '#3b82f6'
          }}
          transition={{ duration: 4, ease: "easeInOut" }}
          className="w-32 h-32 rounded-full shadow-2xl shadow-primary/20"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-black text-white drop-shadow-md">{counter}</span>
        </div>
      </div>

      <div className="mt-16 flex gap-4">
        {['Inhale', 'Hold', 'Exhale', 'Hold'].map((p, i) => (
          <div key={i} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${
            (phase === 'inhale' && i === 0) || 
            (phase === 'hold' && i === 1) || 
            (phase === 'exhale' && i === 2) || 
            (phase === 'hold-empty' && i === 3) 
              ? 'bg-primary' : 'bg-gray-200'
          }`} />
        ))}
      </div>
    </Card>
  );
};

const YogaAnimation: React.FC = () => {
  return (
    <div className="flex justify-center mb-8 py-8 bg-gradient-to-b from-purple-50/50 to-transparent rounded-3xl overflow-hidden relative border border-purple-100/50">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              scale: 0, 
              x: Math.random() * 600 - 300, 
              y: Math.random() * 400 - 200 
            }}
            animate={{ 
              scale: [0, 1, 0],
              y: [200, -200]
            }}
            transition={{ 
              duration: 8 + Math.random() * 8,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5
            }}
            className="absolute w-2 h-2 rounded-full bg-purple-400"
          />
        ))}
      </div>
      
      <div className="relative">
        {/* Outer Halo */}
        <motion.div
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-purple-500 rounded-full blur-[60px]"
        />

        {/* Breathing Circle */}
        <motion.div
          animate={{ 
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative w-48 h-48 flex items-center justify-center bg-white/40 backdrop-blur-md rounded-full shadow-2xl border-4 border-white/60"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Flower2 className="w-24 h-24 text-purple-600" strokeWidth={1} />
          </motion.div>
          
          <div className="absolute bottom-6 text-[10px] font-black uppercase tracking-widest text-purple-400 animate-pulse">
            Inhale ... Exhale
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const YogaPoseCard: React.FC<{ pose: any }> = ({ pose }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'video'>('info');
  
  const images: Record<string, string> = {
    'child': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop',
    'cat': 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?q=80&w=1200&auto=format&fit=crop',
    'cow': 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?q=80&w=1200&auto=format&fit=crop',
    'cat-cow': 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?q=80&w=1200&auto=format&fit=crop',
    'downward': 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?q=80&w=1200&auto=format&fit=crop',
    'dog': 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?q=80&w=1200&auto=format&fit=crop',
    'warrior': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop',
    'tree': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop',
    'cobra': 'https://images.unsplash.com/photo-1591343395082-e120087004b4?q=80&w=1200&auto=format&fit=crop',
    'bridge': 'https://images.unsplash.com/photo-1510894347713-fc3ed6fdf539?q=80&w=1200&auto=format&fit=crop',
    'pigeon': 'https://images.unsplash.com/photo-1545209690-821bc551ec95?q=80&w=1200&auto=format&fit=crop',
    'easy': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop',
    'sukhasana': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop',
    'savasana': 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1200&auto=format&fit=crop',
    'corpse': 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1200&auto=format&fit=crop',
    'mountain': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop',
    'forward fold': 'https://images.unsplash.com/photo-1541591415081-32bf9eeed782?q=80&w=1200&auto=format&fit=crop',
    'plank': 'https://images.unsplash.com/photo-1566241440091-ec10df8db2e1?q=80&w=1200&auto=format&fit=crop',
    'default': 'https://images.unsplash.com/photo-1545209690-821bc551ec95?q=80&w=1200&auto=format&fit=crop'
  };

  const videos: Record<string, string> = {
    'child': 'https://www.youtube.com/embed/2MJGg-dUKh0',
    'cat-cow': 'https://www.youtube.com/embed/kqnua4rHVUo',
    'downward': 'https://www.youtube.com/embed/6EpSH6v8Fsc',
    'tree': 'https://www.youtube.com/embed/Dic2933_3p0',
    'cobra': 'https://www.youtube.com/embed/fOdrW7nf9gw',
    'easy': 'https://www.youtube.com/embed/fA5u0E_E4-0',
    'savasana': 'https://www.youtube.com/embed/1v0S_m_T0K8',
  };

  const getPoseImage = (poseObj: any) => {
    const key = (poseObj.key || '').toLowerCase();
    const name = (poseObj.name || '').toLowerCase();
    if (key && images[key]) return images[key];
    for (const k in images) {
      if (name.includes(k)) return images[k];
    }
    return images.default;
  };

  const getPoseVideo = (poseObj: any) => {
    const key = (poseObj.key || '').toLowerCase();
    const name = (poseObj.name || '').toLowerCase();
    if (key && videos[key]) return videos[key];
    for (const k in videos) {
      if (name.includes(k)) return videos[k];
    }
    return null;
  };

  const videoUrl = getPoseVideo(pose);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setShowDetails(true)}
        className="bg-white rounded-3xl overflow-hidden border border-purple-100 shadow-sm group hover:shadow-xl transition-all cursor-pointer relative"
      >
        <div className="relative h-48 overflow-hidden">
          <img 
            src={getPoseImage(pose)} 
            alt={pose.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4">
            <span className="text-white font-black uppercase text-xs tracking-widest bg-purple-500/80 px-2 py-1 rounded backdrop-blur-sm">
              {pose.duration}
            </span>
          </div>
          {videoUrl && (
            <div className="absolute top-4 left-4">
              <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl text-primary flex items-center gap-1.5 shadow-lg">
                <Film className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Video Demo</span>
              </div>
            </div>
          )}
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-4 right-4"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
        </div>
        <div className="p-6">
          <h4 className="text-xl font-black text-gray-900 mb-2">{pose.name}</h4>
          <p className="text-gray-500 text-sm font-medium leading-relaxed line-clamp-2">{pose.description}</p>
          <div className="mt-4 flex items-center text-purple-600 text-xs font-black uppercase tracking-widest group-hover:gap-2 transition-all">
            Full Instructions <Play className="w-3 h-3 ml-1" />
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="h-64 relative bg-black">
                {activeTab === 'video' && videoUrl ? (
                  <iframe 
                    src={`${videoUrl}?autoplay=1&mute=1`}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media; fullscreen"
                    title={pose.name}
                  />
                ) : (
                  <img 
                    src={getPoseImage(pose)} 
                    alt={pose.name} 
                    className="w-full h-full object-cover" 
                  />
                )}
                <button 
                  onClick={() => setShowDetails(false)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/70 transition-all font-bold z-20"
                >
                  ✕
                </button>
              </div>

              <div className="flex border-b border-gray-100">
                <button 
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Overview & Benefits
                </button>
                {videoUrl && (
                  <button 
                    onClick={() => setActiveTab('video')}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'video' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Video Demo
                  </button>
                )}
              </div>
              
              <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 mb-2">{pose.name}</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-1.5 rounded-xl">
                      <Timer className="w-4 h-4" />
                      <span className="font-black text-xs uppercase tracking-widest">{pose.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-6 rounded-3xl">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-2">Physiological Impact</h5>
                    <p className="text-gray-800 font-medium text-sm leading-relaxed">{pose.benefits}</p>
                  </div>

                  <div className="bg-emerald-50 p-6 rounded-3xl">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Mental Peace</h5>
                    <p className="text-gray-800 font-medium text-sm leading-relaxed">{pose.mental_health_impact}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-8 rounded-[32px] border border-gray-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black">?</div>
                    <h5 className="text-xs font-black uppercase tracking-widest text-gray-800">Step-by-Step Instructions</h5>
                  </div>
                  <div className="space-y-4">
                    {(pose.instructions || pose.description).split('. ').map((step: string, i: number) => step.trim() && (
                      <div key={i} className="flex gap-4 group">
                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:text-primary group-hover:border-primary transition-all">
                          {i + 1}
                        </div>
                        <p className="text-gray-600 font-medium leading-relaxed text-sm pt-0.5">{step.endsWith('.') ? step : `${step}.`}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100/50">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Aids/Cures</h5>
                  <p className="text-gray-800 font-medium text-sm">{pose.cures}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const YogaGuide: React.FC<{ age?: number; gender?: string; onComplete: () => void; onCancel: () => void }> = ({ age, gender, onComplete, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [routine, setRoutine] = useState<any | null>(null);
  
  // Fields for missing data
  const [inputAge, setInputAge] = useState(age?.toString() || '');
  const [inputGender, setInputGender] = useState(gender || '');
  const [savingProfile, setSavingProfile] = useState(false);
  
  const hasProfile = age && gender;

  const generateRoutine = async () => {
    if (!hasProfile) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const promptText = `Recommend a personalized 5-minute yoga routine for a ${age} year old ${gender} to quickly release mental stress and anxiety. 
      Focus ONLY on poses that are known for rapid calming effects on the nervous system.
      
      YOU MUST RESPOND ONLY WITH A JSON OBJECT in the following format:
      {
        "title": "A calming title focusing on mental relief",
        "poses": [
          {
            "name": "Pose Name (e.g., Child's Pose, Cat-Cow, Forward Fold)",
            "description": "A very brief 1-sentence catchy description",
            "instructions": "Incredible step-by-step instructions on HOW to perform the pose perfectly. Use short sentences separated by dots. Focus on breathing and body alignment.",
            "duration": "e.g., 60 seconds",
            "key": "ONE WORD keyword matching the pose (child, cat, cow, downward, warrior, tree, cobra, bridge, pigeon, easy, savasana, mountain)",
            "benefits": "Physical and physiological benefits of the pose",
            "mental_health_impact": "How it specifically calms the mind, releases stress, or improves mental health",
            "cures": "What specific diseases, ailments, or mental conditions it helps alleviate/cure"
          }
        ],
        "tip": "A closing mindfulness tip for immediate peace"
      }
      Do not include any other text or markdown formatting outside the JSON.`;
      
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: promptText
      });
      
      const text = result.text || '';
      const cleanJson = text.replace(/```json|```/g, '').trim();
      setRoutine(JSON.parse(cleanJson));
    } catch (err) {
      console.error('Error generating yoga routine:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveAndGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inputAge || !inputGender) return;
    
    setSavingProfile(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        age: parseInt(inputAge),
        gender: inputGender
      });
      // Component will re-render via onSnapshot in parent
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (hasProfile && !routine) {
      generateRoutine();
    }
  }, [hasProfile, routine]);

  if (!hasProfile) {
    return (
      <Card className="p-12 border-none shadow-2xl bg-white relative">
        <button onClick={onCancel} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 transition-all font-black text-xs uppercase tracking-widest">
          Close
        </button>
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mx-auto mb-6">
            <UserIcon className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Almost There!</h2>
          <p className="text-gray-500 font-medium mb-8">We need a few details to create your personalized relief routine.</p>
          
          <form onSubmit={saveAndGenerate} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Age</label>
              <input 
                type="number" 
                required
                value={inputAge}
                onChange={(e) => setInputAge(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:border-primary/20 focus:ring-2 focus:ring-primary/10 transition-all outline-none font-bold" 
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Gender</label>
              <select 
                required
                value={inputGender}
                onChange={(e) => setInputGender(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:border-primary/20 focus:ring-2 focus:ring-primary/10 transition-all outline-none font-bold"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Button type="submit" className="w-full h-14 text-lg mt-4" loading={savingProfile}>
              Save and Start
            </Button>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-12 border-none shadow-2xl bg-white min-h-[500px] relative">
      <button onClick={onCancel} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 transition-all font-black text-xs uppercase tracking-widest">
        End Session
      </button>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-6" />
          <p className="text-xl font-black text-gray-800 animate-pulse uppercase tracking-tight">Crafting Your Routine...</p>
          <p className="text-gray-400 font-medium mt-2">Consulting with Zen AI</p>
        </div>
      ) : (routine && routine.poses) ? (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{routine.title}</h2>
          </div>

          <YogaAnimation />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {routine.poses.map((pose: any, i: number) => (
              <YogaPoseCard key={i} pose={pose} />
            ))}
          </div>

          {routine.tip && (
            <div className="bg-purple-50 p-6 rounded-3xl mb-12 border border-purple-100 flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-purple-500 shrink-0 mt-1" />
              <p className="text-purple-900 font-medium italic">"{routine.tip}"</p>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-6 p-8 bg-gray-50 rounded-3xl">
            <div className="flex-1">
              <p className="font-black text-gray-900 text-lg mb-1">Session Complete?</p>
              <p className="text-gray-500 text-sm font-medium">Claim your 100 Zen Points for finding your peace today.</p>
            </div>
            <Button 
              className="w-full md:w-auto h-14 px-10 text-lg" 
              onClick={onComplete}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" /> Finish & Claim Points
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-lg font-bold text-gray-800">Something went wrong</p>
          <Button variant="secondary" onClick={generateRoutine} className="mt-4">Retry Generation</Button>
        </div>
      )}
    </Card>
  );
};

const DistractMood: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [filter, setFilter] = useState('All');

  const content = [
    {
      title: "Ted Lasso",
      type: "Series",
      category: "Wholesome",
      mood: "Pure Optimism",
      description: "An American coach brings relentless positivity to a struggling English soccer team. It's about kindness, belief, and the power of team spirit.",
      image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800&auto=format&fit=crop",
      trailer: "https://www.youtube.com/embed/3u7EIiohs6U",
      rating: "9.1"
    },
    {
      title: "Spirited Away",
      type: "Movie",
      category: "Animated",
      mood: "Immersive Escape",
      description: "Enter a magical world of spirits and wonder. This Studio Ghibli masterpiece is a visual feast that completely transports your mind elsewhere.",
      image: "https://images.unsplash.com/photo-1520038410233-7141f77e49aa?q=80&w=800&auto=format&fit=crop",
      trailer: "https://www.youtube.com/embed/ByXuk9QqQmc",
      rating: "8.6"
    },
    {
      title: "Chef",
      type: "Movie",
      category: "Wholesome",
      mood: "Feel-Good",
      description: "After a public breakdown, a chef starts a food truck journey with his son. A celebration of passion, family, and great food.",
      image: "https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=800&auto=format&fit=crop",
      trailer: "https://www.youtube.com/embed/wgFws3AoIUY",
      rating: "7.3"
    },
    {
      title: "The Good Place",
      type: "Series",
      category: "Comedy",
      mood: "Smart & Funny",
      description: "A hilarious and profound exploration of what it means to be a good person, set in a colorful version of the afterlife.",
      image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop",
      trailer: "https://www.youtube.com/embed/RfBgT5d726c",
      rating: "8.2"
    },
    {
      title: "Kiki's Delivery Service",
      type: "Movie",
      category: "Animated",
      mood: "Quiet Peace",
      description: "A young witch finds her place in the world. A gentle, beautiful story about independence and finding your own pace.",
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop",
      trailer: "https://www.youtube.com/embed/4bG17OYs-GA",
      rating: "7.8"
    },
    {
      title: "Wonka",
      type: "Movie",
      category: "Wholesome",
      mood: "Pure Imagination",
      description: "A young Willy Wonka, chock-full of ideas and determined to change the world one delectable bite at a time.",
      image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop",
      trailer: "https://www.youtube.com/embed/otNh9b078qc",
      rating: "7.0"
    }
  ];

  const filtered = filter === 'All' ? content : content.filter(c => c.category === filter);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Card className="p-0 border-none shadow-2xl bg-black min-h-screen relative overflow-hidden text-white">
      {/* Dynamic Background */}
      <AnimatePresence mode="wait">
        <motion.div
           key={selectedMovie?.title || 'default'}
           initial={{ opacity: 0 }}
           animate={{ opacity: isPlaying ? 0.1 : 0.4 }}
           exit={{ opacity: 0 }}
           className="absolute inset-0 z-0 transition-opacity duration-1000"
        >
          <img 
            src={selectedMovie?.image || content[0].image} 
            className="w-full h-full object-cover blur-md scale-110" 
            alt="background"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 h-full flex flex-col">
        <div className={`p-8 md:p-12 transition-all duration-500 ${isPlaying ? 'opacity-0 h-0 p-0 overflow-hidden' : 'opacity-100'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black mb-2 flex items-center gap-4">
                <Film className="w-8 h-8 text-orange-500" />
                Zen Cinema
              </h2>
              <p className="text-gray-400 font-medium">Uplifting stories curated to distract and delight.</p>
            </div>
            <button 
              onClick={onCancel} 
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Hero Section / Theater View */}
        <div className="flex-grow px-4 md:px-12 pb-12">
          <AnimatePresence mode="wait">
            {selectedMovie ? (
              <motion.div
                key={selectedMovie.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-7xl mx-auto"
              >
                <div className={`grid grid-cols-1 ${isPlaying ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-12 items-center`}>
                  <div className={`${isPlaying ? 'lg:col-span-12' : 'lg:col-span-8'} transition-all duration-700`}>
                    <div className="relative rounded-[40px] overflow-hidden aspect-video lg:aspect-[21/9] shadow-inner shadow-black border border-white/10 bg-black">
                      <iframe 
                        src={`${selectedMovie.trailer}?autoplay=${isPlaying ? 1 : 0}&rel=0&controls=1&modestbranding=1`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                        allowFullScreen
                        title={selectedMovie.title}
                      />
                    </div>
                  </div>
                  
                  {!isPlaying && (
                    <div className="lg:col-span-4 space-y-8 py-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="px-4 py-1.5 bg-orange-500 rounded-full text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-500/20">
                            {selectedMovie.category}
                          </span>
                          <span className="flex items-center gap-1 text-yellow-400 text-sm font-black tracking-widest">
                            ★ {selectedMovie.rating}
                          </span>
                        </div>
                        <h3 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">{selectedMovie.title}</h3>
                        <p className="text-xl text-gray-300 leading-relaxed font-medium line-clamp-4">
                          {selectedMovie.description}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-4 pt-4">
                        <Button 
                          size="lg" 
                          className="rounded-[20px] h-16 px-10 bg-white text-black hover:bg-white/90 font-black text-lg shadow-xl"
                          onClick={() => setIsPlaying(true)}
                        >
                          <Play className="w-6 h-6 mr-3 fill-current" /> Play Trailer
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="lg" 
                          className="rounded-[20px] h-16 px-8 text-white hover:bg-white/10 font-bold border border-white/10"
                          onClick={() => { setSelectedMovie(null); setIsPlaying(false); }}
                        >
                          Back to Gallery
                        </Button>
                      </div>
                    </div>
                  )}

                  {isPlaying && (
                    <div className="flex justify-center mt-8">
                       <Button 
                        variant="outline" 
                        className="rounded-full border-white/20 text-white hover:bg-white/10 font-black px-12 py-6 text-xl tracking-widest"
                        onClick={() => setIsPlaying(false)}
                      >
                        EXIT CINEMA MODE
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="max-w-7xl mx-auto">
                {/* Categories / Filters */}
                <div className="flex flex-wrap gap-4 mb-16">
                  {['All', 'Wholesome', 'Animated', 'Comedy', 'Focus'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all
                        ${filter === cat ? 'bg-white text-black scale-105 shadow-xl shadow-white/10' : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'}`}
                    >
                      {cat}
                    </button>
                  ))}
                  <Button 
                    variant="outline" 
                    className="ml-auto rounded-full border-orange-500/50 text-orange-400 hover:bg-orange-500/10 h-12"
                    onClick={() => {
                      const rand = content[Math.floor(Math.random() * content.length)];
                      setSelectedMovie(rand);
                      setIsPlaying(false);
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> Surprise Me
                  </Button>
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8">
                  {filtered.map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -12, scale: 1.05 }}
                      onClick={() => { setSelectedMovie(item); setIsPlaying(false); }}
                      className="group cursor-pointer"
                    >
                      <div className="relative aspect-[2/3] rounded-[32px] overflow-hidden mb-4 shadow-2xl border border-white/5 bg-gray-900">
                        <img 
                          src={item.image} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80 group-hover:opacity-100" 
                          alt={item.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-16 h-16 rounded-full bg-orange-500 text-white flex items-center justify-center scale-75 group-hover:scale-100 transition-all duration-500 shadow-2xl">
                            <Play className="w-6 h-6 fill-current ml-1" />
                          </div>
                        </div>
                      </div>
                      <h4 className="font-black text-lg leading-tight group-hover:text-orange-400 transition-colors uppercase tracking-tight">{item.title}</h4>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1.5">{item.mood}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {!selectedMovie && (
          <div className="max-w-7xl mx-auto w-full px-12 pb-20">
             <div className="p-10 bg-white/5 rounded-[48px] border border-white/10 flex flex-col md:flex-row items-center gap-10">
                <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 border border-orange-500/30">
                  <Tv className="w-10 h-10 text-orange-500" />
                </div>
                <div className="text-center md:text-left">
                  <h4 className="text-2xl font-black mb-3">Cinematic Distraction Therapy</h4>
                  <p className="text-gray-400 font-medium leading-relaxed italic text-lg max-w-3xl">
                    "Cognitive Absorption" through storytelling is a proven way to break intense stress cycles. 
                    When you immerse yourself in a narrative, your brain shifts from self-referential rumination to empathic observing, 
                    effectively lowering cortisol and giving your emotional system a much-needed reset.
                  </p>
                </div>
             </div>
          </div>
        )}
      </div>
    </Card>
  );
};

const NatureMeditation: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const videos = [
    { title: "Peaceful Forest Rain", url: "https://www.youtube.com/embed/mPZkdNFkNps", id: 1 },
    { title: "Deep Ocean Waves", url: "https://www.youtube.com/embed/vPhg6sc1Mk4", id: 2 },
    { title: "Mountain Stream", url: "https://www.youtube.com/embed/6EpSH6v8Fsc", id: 3 },
    { title: "Gentle Snowfall", url: "https://www.youtube.com/embed/jzYyDhz_0w4", id: 4 },
    { title: "Sunset Beach", url: "https://www.youtube.com/embed/0nRR_5m0OOM", id: 5 },
    { title: "Tropical Island", url: "https://www.youtube.com/embed/mNMvP_J03t4", id: 6 }
  ];

  return (
    <Card className="p-8 border-none shadow-2xl bg-white min-h-[600px] relative">
      <button onClick={onCancel} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 transition-all font-black text-xs uppercase tracking-widest z-30">
        Exit
      </button>

      <div className="mb-10">
        <h2 className="text-3xl font-black text-emerald-600 mb-2">Nature Meditation</h2>
        <p className="text-gray-500 font-medium">Short, high-quality visual escapes to ground your senses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="aspect-video bg-black rounded-[32px] overflow-hidden shadow-2xl border-4 border-white">
            {selectedVideo ? (
              <iframe 
                src={`${selectedVideo.url}?autoplay=1&mute=0&rel=0&modestbranding=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
                title={selectedVideo.title}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                <Tv className="w-16 h-16 opacity-20" />
                <p className="font-bold">Select a scene to begin your escape</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {videos.map((vid) => (
            <button
              key={vid.id}
              onClick={() => setSelectedVideo(vid)}
              className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 group ${selectedVideo?.id === vid.id ? 'bg-emerald-50 border-emerald-100 border' : 'hover:bg-gray-50 border border-transparent'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${selectedVideo?.id === vid.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-500'}`}>
                {selectedVideo?.id === vid.id ? <Play className="w-5 h-5 fill-current" /> : <Clapperboard className="w-5 h-5" />}
              </div>
              <span className={`font-bold ${selectedVideo?.id === vid.id ? 'text-emerald-700' : 'text-gray-600'}`}>{vid.title}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default ZenZone;

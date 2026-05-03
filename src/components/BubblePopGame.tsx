import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Trophy, X, Sparkles, Zap } from 'lucide-react';
import { Card } from './UI';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  points: number;
  type: 'normal' | 'gold' | 'bonus';
}

interface BubblePopGameProps {
  onComplete: (score: number) => void;
  onCancel: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

const BubblePopGame: React.FC<BubblePopGameProps> = ({ onComplete, onCancel }) => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [gameState, setGameState] = useState<'initial' | 'playing' | 'gameOver'>('initial');
  const [showCombo, setShowCombo] = useState(false);
  const [multiplier, setMultiplier] = useState(1);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const scoreRef = useRef(0);
  const multiplierTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const colors = [
    'bg-teal-400',
    'bg-blue-400',
    'bg-indigo-400',
    'bg-purple-400',
    'bg-pink-400'
  ];

  const difficultySettings = {
    easy: { spawnMult: 1.5, speedMult: 1.3, label: 'Gentle' },
    medium: { spawnMult: 1.0, speedMult: 1.0, label: 'Balanced' },
    hard: { spawnMult: 0.7, speedMult: 0.8, label: 'Intense' }
  };

  const spawnBubble = useCallback(() => {
    if (gameState !== 'playing' || timeLeft <= 0) return;

    const id = Math.random();
    const typeRand = Math.random();
    let type: 'normal' | 'gold' | 'bonus' = 'normal';
    let points = 10;
    let color = colors[Math.floor(Math.random() * colors.length)];
    let size = Math.random() * 40 + 40;

    if (typeRand > 0.96) {
      type = 'bonus';
      points = 50;
      color = 'bg-rose-500';
      size = 35;
    } else if (typeRand > 0.88) {
      type = 'gold';
      points = 25;
      color = 'bg-yellow-400';
      size = 50;
    }

    const difficultyFactor = timeLeft / 30; // 1 at start, 0 at end
    const modifiers = difficultySettings[difficulty];
    
    // Speed increases as difficultyFactor decreases
    const duration = (1.5 + (difficultyFactor * 3.5)) * modifiers.speedMult; 
    
    const newBubble: Bubble = {
      id,
      x: Math.random() * 80 + 10,
      y: 110,
      size,
      speed: duration,
      color,
      points,
      type
    };

    setBubbles(prev => [...prev, newBubble]);
  }, [gameState, timeLeft, difficulty]);

  // Game Loop for spawning
  useEffect(() => {
    if (gameState !== 'playing') return;

    const modifiers = difficultySettings[difficulty];
    // Scale spawn rate: 500ms at start, 150ms at end
    const spawnRate = (150 + ((timeLeft / 30) * 350)) * modifiers.spawnMult;
    const spawnInterval = setInterval(spawnBubble, spawnRate);
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(timerInterval);
    };
  }, [gameState, spawnBubble, timeLeft, difficulty]);

  useEffect(() => {
    if (timeLeft === 0 && gameState === 'playing') {
      setGameState('gameOver');
    }
  }, [timeLeft, gameState]);

  const startGame = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff);
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(30);
    setBubbles([]);
    setGameState('playing');
  };

  const quitGame = () => {
    onComplete(score);
  };

  const popBubble = (e: React.PointerEvent, bubble: Bubble) => {
    e.preventDefault();
    setBubbles(prev => prev.filter(b => b.id !== bubble.id));
    
    // Multiplier Logic
    setMultiplier(prev => Math.min(prev + 0.1, 5));
    if (multiplierTimeoutRef.current) clearTimeout(multiplierTimeoutRef.current);
    multiplierTimeoutRef.current = setTimeout(() => setMultiplier(1), 800);

    const addedPoints = Math.round(bubble.points * multiplier);
    setScore(prev => {
      const newScore = prev + addedPoints;
      scoreRef.current = newScore;
      return newScore;
    });

    // Visual Feedback: Floating Text
    const rect = e.currentTarget.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + rect.height / 2;
      
      const newText = {
        id: Math.random(),
        x,
        y: y - 20,
        text: `+${addedPoints}`,
        color: bubble.type === 'bonus' ? 'text-rose-600' : bubble.type === 'gold' ? 'text-yellow-600' : 'text-teal-600'
      };
      setFloatingTexts(prev => [...prev, newText]);
      setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== newText.id)), 800);

      // Visual Feedback: Particles
      const newParticles = Array.from({ length: 6 }).map(() => ({
        id: Math.random(),
        x: x,
        y: y,
        color: bubble.color
      }));
      setParticles(prev => [...prev, ...newParticles]);
      setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id))), 600);
    }

    if (bubble.type === 'bonus') {
      setShowCombo(true);
      setTimeout(() => setShowCombo(false), 1000);
    }
  };

  if (gameState === 'initial') {
    return (
      <Card className="p-12 flex flex-col items-center justify-center text-center bg-white border-none shadow-2xl min-h-[600px]">
        <div className="w-20 h-20 bg-teal-100 rounded-3xl flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-teal-600" />
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Bubble Pop</h2>
        <p className="text-gray-500 font-medium mb-10 max-w-sm">
          A meditative experience. Pop bubbles to clear your mind and earn ZenPoints.
          <br /><span className="text-rose-500 font-bold">Rose bubbles are worth 50 points!</span>
        </p>

        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Difficulty</p>
            <div className="grid grid-cols-3 gap-3">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`py-3 rounded-xl text-xs font-black uppercase tracking-tighter transition-all border-2 ${
                    difficulty === level 
                      ? 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/20' 
                      : 'bg-white text-gray-400 border-gray-100 hover:border-teal-200'
                  }`}
                >
                  {difficultySettings[level].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full">
            <button 
              onClick={() => startGame(difficulty)}
              className="w-full h-16 bg-teal-500 text-white rounded-2xl font-black text-xl hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20 active:scale-95"
            >
              Start Meditation
            </button>
            <button 
              onClick={onCancel}
              className="text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-600"
            >
              Back to Zone
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="p-8 flex flex-col relative overflow-hidden border-none shadow-2xl min-h-[600px] bg-gradient-to-b from-teal-50 via-white to-blue-50 touch-none select-none"
    >
      {/* HUD */}
      <div className="flex justify-between items-start mb-8 z-30 relative pt-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-teal-600">
            <Trophy className="w-5 h-5" />
            <span className="text-3xl font-black tabular-nums">{score}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest bg-white/50 px-2 py-0.5 rounded-full border border-teal-100">
              ZenPoints
            </span>
            {multiplier > 1 && (
              <motion.span 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100"
              >
                {multiplier.toFixed(1)}x Combo
              </motion.span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-white shadow-sm">
          <Timer className={`w-5 h-5 ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-gray-400'}`} />
          <span className={`text-2xl font-black tabular-nums ${timeLeft < 10 ? 'text-rose-500' : 'text-gray-700'}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      <button 
        onClick={onCancel}
        className="absolute top-8 right-8 text-gray-300 hover:text-gray-500 transition-all font-black text-[10px] uppercase tracking-widest z-40 bg-white/50 p-2 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Game Stage */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <AnimatePresence>
          {bubbles.map(bubble => (
            <motion.button
              key={bubble.id}
              initial={{ y: 800, opacity: 0, scale: 0.8 }}
              animate={{ 
                y: -200, 
                opacity: 1, 
                scale: [1, 1.05, 1],
                x: [0, 15, -15, 0], // Drifting zig-zag
              }}
              exit={{ 
                scale: 2.5, 
                opacity: 0,
                transition: { duration: 0.15, ease: "easeOut" } 
              }}
              transition={{ 
                y: { duration: bubble.speed, ease: "linear" },
                opacity: { duration: 0.3 },
                scale: { 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                },
                x: { 
                  duration: 2.5 + Math.random(), 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }
              }}
              onPointerDown={(e) => popBubble(e, bubble)}
              className={`absolute rounded-full border-2 border-white/80 shadow-[0_0_25px_rgba(255,255,255,0.4)] flex items-center justify-center transition-opacity active:scale-110 ${bubble.color} bg-opacity-40 backdrop-blur-sm group`}
              style={{ 
                left: `${bubble.x}%`,
                width: bubble.size, 
                height: bubble.size,
                zIndex: bubble.type === 'bonus' ? 25 : 10
              }}
            >
              {/* Internal shine */}
              <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 rounded-full bg-white/50 blur-[2px] pointer-events-none" />
              
              {/* Type Indicators */}
              {bubble.type === 'gold' && <Sparkles className="w-1/2 h-1/2 text-white/50 group-hover:scale-125 transition-transform" />}
              {bubble.type === 'bonus' && <Zap className="w-1/2 h-1/2 text-white animate-pulse group-hover:scale-125 transition-transform" />}
            </motion.button>
          ))}
        </AnimatePresence>

        {/* Particles Effect */}
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
              animate={{ 
                x: p.x + (Math.random() - 0.5) * 150, 
                y: p.y + (Math.random() - 0.5) * 150, 
                opacity: 0,
                scale: 0 
              }}
              className={`absolute w-3 h-3 rounded-full ${p.color} blur-[1px] z-50 pointer-events-none shadow-sm`}
            />
          ))}
        </AnimatePresence>

        {/* Floating Scores */}
        <AnimatePresence>
          {floatingTexts.map(t => (
            <motion.div
              key={t.id}
              initial={{ x: t.x - 20, y: t.y, opacity: 0, scale: 0.5 }}
              animate={{ y: t.y - 120, opacity: 1, scale: 1.5 }}
              exit={{ opacity: 0, y: t.y - 180 }}
              className={`absolute font-black ${t.color} text-xl pointer-events-none drop-shadow-md z-50`}
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Combo Feedback */}
        <AnimatePresence>
          {showCombo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 0 }}
              animate={{ opacity: 1, scale: 1.2, y: -50 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="bg-rose-500 text-white px-6 py-2 rounded-2xl font-black text-2xl shadow-xl shadow-rose-500/20 uppercase tracking-tighter">
                Super Pop!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over Modal */}
        <AnimatePresence>
          {gameState === 'gameOver' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-md z-[100] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-sm flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-teal-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-teal-500/30">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-4xl font-black text-gray-900 mb-2 whitespace-nowrap">Session Complete</h3>
                <p className="text-gray-400 font-bold mb-8 uppercase tracking-widest text-xs">You stayed focused!</p>
                
                <div className="w-full bg-white border-2 border-teal-50 rounded-3xl p-8 mb-8 shadow-sm">
                  <p className="text-xs font-black text-teal-400 uppercase tracking-widest mb-2">Final ZenScore</p>
                  <p className="text-6xl font-black text-teal-600 tabular-nums">{score}</p>
                </div>

                <div className="flex flex-col gap-4 w-full">
                  <button 
                    onClick={() => startGame(difficulty)}
                    className="w-full h-16 bg-teal-500 text-white rounded-2xl font-black text-xl hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20 active:scale-95"
                  >
                    Restart Session
                  </button>
                  <button 
                    onClick={quitGame}
                    className="w-full h-16 bg-white border-2 border-gray-100 text-gray-500 rounded-2xl font-black text-xl hover:bg-gray-50 transition-all active:scale-95"
                  >
                    Finish & Claim
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex justify-center">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] animate-pulse">
          Tap bubbles to find your zen
        </p>
      </div>
    </Card>
  );
};

export default BubblePopGame;

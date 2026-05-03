import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Sparkles, ArrowRight, Heart } from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const MoodReminder: React.FC = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;

    const checkLastLog = async () => {
      const q = query(
        collection(db, 'users', user.uid, 'logs'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const lastLog = snapshot.docs[0].data();
        const lastDate = lastLog.createdAt?.toDate() || new Date(lastLog.createdAt);
        setLastCheckIn(lastDate);
        
        const today = new Date();
        const isToday = lastDate.getDate() === today.getDate() &&
                        lastDate.getMonth() === today.getMonth() &&
                        lastDate.getFullYear() === today.getFullYear();
        
        if (!isToday) {
          // Show reminder after a short delay
          setTimeout(() => setShow(true), 3000);
        }
      } else {
        // No logs at all, show reminder
        setTimeout(() => setShow(true), 5000);
      }
    };

    checkLastLog();
  }, [user]);

  if (!show || !user) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 100, x: '-50%' }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] w-[calc(100%-2rem)] max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-primary/20 overflow-hidden">
            <div className="bg-primary p-1" />
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                  <Bell className="w-6 h-6 text-primary animate-ring" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-black text-gray-900 tracking-tight flex items-center gap-2">
                       Daily Check-in
                       <Sparkles className="w-3 h-3 text-amber-500" />
                    </h4>
                    <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed mb-4">
                    {lastCheckIn 
                      ? "It's been a while since your last check-in. How are you feeling right now?"
                      : "Welcome! Start your journey by logging your first mood check-in."}
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        window.location.hash = '/dashboard';
                        setShow(false);
                      }}
                      className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                    >
                      Check-in Now
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => setShow(false)}
                      className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-2 bg-gray-50 border-t flex items-center gap-2">
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">MindCare Assistant Reminders</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MoodReminder;

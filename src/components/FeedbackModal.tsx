import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MessageSquare, Star, Sparkles, Heart, ShieldAlert } from 'lucide-react';
import { Button, Card } from './UI';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || submitting) return;

    if (user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        content: feedback,
        rating: rating,
        createdAt: serverTimestamp(),
        source: 'web_app_navbar'
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        // Reset after modal closes
        setTimeout(() => {
          setSubmitted(false);
          setFeedback('');
          setRating(0);
        }, 500);
      }, 2000);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            <div className="bg-primary p-8 text-white relative">
              <div className="absolute top-0 right-0 p-8">
                <button 
                  onClick={onClose}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tight">Share Your Thoughts</h2>
              <p className="text-white/80 font-medium mt-2">Your feedback helps us build a better sanctuary for everyone.</p>
            </div>

            <div className="p-8 md:p-10">
              {user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10 text-amber-500" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Verification Required</h3>
                  <p className="text-gray-500 font-medium mb-8">Please verify your email address to submit feedback and contribute to improving MindCare.</p>
                  <Button 
                    variant="outline"
                    onClick={onClose}
                    className="w-full h-16 rounded-full font-black uppercase tracking-widest text-sm border-gray-200"
                  >
                    Close
                  </Button>
                </div>
              ) : submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <Heart className="w-10 h-10 text-green-500 fill-green-500" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Thank You!</h3>
                  <p className="text-gray-500 font-medium">Your feedback has been received. We appreciate your input.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Overall Experience</label>
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`p-3 rounded-2xl transition-all ${rating >= star ? 'bg-amber-100 text-amber-500 scale-110 shadow-sm' : 'bg-gray-50 text-gray-300 hover:bg-gray-100'}`}
                        >
                          <Star className={`w-6 h-6 ${rating >= star ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">How can we improve?</label>
                    <textarea
                      required
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Tell us about your experience, report a bug, or suggest a feature..."
                      className="w-full min-h-[150px] p-6 bg-gray-50 rounded-3xl font-medium focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none border border-transparent transition-all resize-none text-gray-700"
                    />
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row gap-3">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      className="w-full h-16 rounded-full font-black uppercase tracking-widest text-sm border-gray-200"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      loading={submitting} 
                      disabled={!feedback.trim()}
                      className="w-full h-16 rounded-full font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
                    >
                      <Send className="w-5 h-5" />
                      Submit Feedback
                    </Button>
                  </div>
                  <p className="text-center text-[10px] font-bold text-gray-400 mt-6 flex items-center justify-center gap-2">
                      <Sparkles className="w-3 h-3 text-primary" />
                      Every message is read by our small team
                    </p>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

export default FeedbackModal;

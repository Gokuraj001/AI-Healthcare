/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Tracker from './pages/Tracker';
import Chat from './pages/Chat';
import FindHelp from './pages/FindHelp';
import Awareness from './pages/Awareness';
import Community from './pages/Community';
import ZenZone from './pages/ZenZone';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import { motion, AnimatePresence } from 'motion/react';
import MoodReminder from './components/MoodReminder';

import { ShieldAlert, Send, RefreshCw } from 'lucide-react';
import { sendEmailVerification, reload } from 'firebase/auth';

const PageRouter: React.FC = () => {
  const { user, loading, userData } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.hash.replace('#', '') || '/');
  const [resending, setResending] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const isUnverified = user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password';

  const handleResend = async () => {
    if (!user || resending) return;
    setResending(true);
    try {
      await sendEmailVerification(user);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setResending(false);
    }
  };

  const handleReload = async () => {
    if (!user || reloading) return;
    setReloading(true);
    try {
      await reload(user);
      if (user.emailVerified) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReloading(false);
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash.replace('#', '') || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Protected route logic
  useEffect(() => {
    if (loading) return;
    
    // Check onboarding status
    if (user && userData && !userData.onboardingCompleted && currentPath !== '/onboarding') {
      window.location.hash = '/onboarding';
      return;
    }

    const protectedPaths = ['/dashboard', '/tracker', '/chat', '/community', '/find-help', '/zen-zone', '/profile'];
    if (!user && protectedPaths.includes(currentPath)) {
      window.location.hash = '/auth';
    }
  }, [user, userData, currentPath, loading]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-secondary/20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-primary font-medium">Finding peace...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPath) {
      case '/': return <Landing />;
      case '/dashboard': return <Dashboard />;
      case '/tracker': return <Tracker />;
      case '/chat': return <Chat />;
      case '/find-help': return <FindHelp />;
      case '/awareness': return <Awareness />;
      case '/community': return <Community />;
      case '/zen-zone': return <ZenZone />;
      case '/auth': return <Auth />;
      case '/onboarding': return <Onboarding />;
      case '/profile': return <Profile />;
      default: return <Landing />;
    }
  };

  return (
    <div className="min-h-screen pt-16">
      <Navbar />
      
      <AnimatePresence>
        {isUnverified && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50 border-b border-amber-100 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-amber-800">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">
                  <span className="font-bold">Email not verified.</span> Please verify your account to unlock all features.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleReload}
                  disabled={reloading}
                  className="flex items-center gap-2 px-4 py-1.5 bg-white text-amber-900 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-amber-100 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${reloading ? 'animate-spin' : ''}`} />
                  Refresh Status
                </button>
                <button 
                  onClick={handleResend}
                  disabled={resending || resendSuccess}
                  className="flex items-center gap-2 px-4 py-1.5 bg-amber-200 text-amber-900 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-amber-300 transition-all disabled:opacity-50"
                >
                  {resendSuccess ? 'Link Sent!' : resending ? 'Sending...' : (
                    <>
                      <Send className="w-3 h-3" />
                      Resend Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPath}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {renderPage()}
        </motion.div>
      </AnimatePresence>
      <MoodReminder />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PageRouter />
    </AuthProvider>
  );
}

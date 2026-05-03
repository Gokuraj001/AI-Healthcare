import React, { useState } from 'react';
import { Button, Card } from '../components/UI';
import { auth, googleProvider } from '../lib/firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification 
} from 'firebase/auth';
import { LogIn, UserPlus, Mail, Lock, Chrome, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { isDisposableEmail, isValidEmailFormat } from '../lib/email-validator';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithPopup(auth, googleProvider);
      window.location.hash = '/dashboard';
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      
      let friendlyMessage = "Failed to sign in with Google. Please try again.";
      
      if (err.code === 'auth/popup-closed-by-user') {
        friendlyMessage = "The sign-in popup was closed before completion. Please try again and keep the window open.";
      } else if (err.code === 'auth/cancelled-by-user') {
        friendlyMessage = "The sign-in request was cancelled. Please try again if you still wish to log in.";
      } else if (err.code === 'auth/network-request-failed') {
        friendlyMessage = "Network error detected. Please check your internet connection and try again.";
      } else if (err.code === 'auth/popup-blocked') {
        friendlyMessage = "The sign-in popup was blocked by your browser. Please allow popups for this site.";
      } else if (err.code === 'auth/operation-not-allowed') {
        friendlyMessage = "Google Sign-In is not currently enabled for this application. Please reach out to support.";
      } else if (err.message) {
        friendlyMessage = `Google Sign-In Error: ${err.message}`;
      }
      
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerificationSent(false);
    
    if (!isValidEmailFormat(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isLogin && isDisposableEmail(email)) {
      setError('Registration with disposable email addresses is not allowed for security reasons. Please use a real email.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.hash = '/dashboard';
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        // Send verification email
        await sendEmailVerification(userCredential.user);
        setVerificationSent(true);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in instead.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center items-center">
      <Card className="w-full max-w-md p-8 md:p-12 shadow-2xl border-none">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-500 font-medium">
            {isLogin ? 'Continue your wellness journey' : 'Start your mental health tracking today'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 italic">
            {error}
          </div>
        )}

        {verificationSent && (
          <div className="mb-6 p-6 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-start gap-4 animate-in fade-in zoom-in slide-in-from-top-2">
            <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-lg leading-tight mb-1">Check your inbox!</p>
              <p className="text-sm font-medium opacity-90 leading-relaxed">
                We've sent a verification link to <span className="font-bold">{email}</span>. Please verify your email before logging in.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 mb-8">
          <Button 
            variant="outline" 
            onClick={handleGoogleSignIn} 
            loading={loading}
            className="w-full py-4 text-gray-700 bg-white"
          >
            <Chrome className="w-5 h-5 mr-3 text-red-500" />
            Continue with Google
          </Button>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 border-t border-gray-100"></div>
            <span className="relative z-10 px-4 bg-white text-xs font-bold text-gray-300 uppercase tracking-widest">Or with email</span>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-6">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent focus:bg-white focus:border-primary/30 focus:ring-0 rounded-2xl transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent focus:bg-white focus:border-primary/30 focus:ring-0 rounded-2xl transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent focus:bg-white focus:border-primary/30 focus:ring-0 rounded-2xl transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <Button type="submit" loading={loading} className="w-full py-4 text-lg">
            {isLogin ? <LogIn className="w-5 h-5 mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
            {isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-10 text-center text-sm font-medium text-gray-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </Card>
      
      {/* Decorative Blob */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10" />
    </div>
  );
};

export default Auth;

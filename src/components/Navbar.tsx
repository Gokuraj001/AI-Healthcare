import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Heart, 
  LayoutDashboard, 
  MessageCircle, 
  Edit3, 
  BookOpen, 
  Users, 
  LogOut,
  Menu,
  X,
  MessageSquare
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import FeedbackModal from './FeedbackModal';

const Navbar: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Tracker', icon: Edit3, path: '/tracker' },
    { name: 'Zen Zone', icon: Heart, path: '/zen-zone' },
    { name: 'AI Chat', icon: MessageCircle, path: '/chat' },
    { name: 'Professional', icon: Users, path: '/find-help' },
    { name: 'Awareness', icon: BookOpen, path: '/awareness' },
    { name: 'Community', icon: Users, path: '/community' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism border-b bg-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.hash = '/'}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">MindCare AI</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {user && navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => window.location.hash = item.path}
                className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-medium text-sm"
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </button>
            ))}
            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l">
                <button 
                  onClick={() => setIsFeedbackOpen(true)}
                  className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors text-sm font-medium mr-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Feedback
                </button>
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                  className="w-8 h-8 rounded-full border-2 border-primary/20 cursor-pointer hover:border-primary transition-all" 
                  alt="Profile" 
                  onClick={() => window.location.hash = '/profile'}
                />
                <button onClick={() => signOut(auth)} className="text-gray-500 hover:text-red-500 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => window.location.hash = '/auth'}
                className="bg-primary text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                Get Started
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 outline-none">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white border-b px-4 pt-2 pb-6 flex flex-col gap-4 shadow-xl">
          {user && navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                window.location.hash = item.path;
                setIsOpen(false);
              }}
              className="flex items-center gap-3 text-gray-600 p-3 rounded-xl hover:bg-secondary/50 font-medium transition-all"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          ))}
          {user ? (
            <>
             <button 
                onClick={() => setIsFeedbackOpen(true)}
                className="flex items-center gap-3 text-gray-600 p-3 rounded-xl hover:bg-secondary/50 font-medium transition-all"
              >
                <MessageSquare className="w-5 h-5" />
                Provide Feedback
              </button>
              <button 
                onClick={() => signOut(auth)} 
                className="flex items-center gap-3 text-red-500 p-3 rounded-xl hover:bg-red-50 font-medium transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </>
          ) : (
            <button 
              onClick={() => window.location.hash = '/auth'}
              className="w-full bg-primary text-white p-3 rounded-xl font-bold shadow-lg"
            >
              Log In
            </button>
          )}
        </div>
      )}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </nav>
  );
};

export default Navbar;

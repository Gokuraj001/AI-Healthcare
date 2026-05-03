import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  User as UserIcon, 
  Weight, 
  Ruler, 
  Heart, 
  Activity, 
  Settings,
  Shield,
  LogOut,
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

const Profile: React.FC = () => {
  const { user, userData } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    displayName: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    bloodGroup: '',
    activityLevel: '',
    healthGoals: [] as string[],
    stressFactors: [] as string[],
    sleepGoal: '',
    waterGoal: ''
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        displayName: userData.displayName || '',
        age: userData.age || '',
        gender: userData.gender || '',
        height: userData.height || '',
        weight: userData.weight || '',
        bloodGroup: userData.bloodGroup || '',
        activityLevel: userData.activityLevel || '',
        healthGoals: userData.healthGoals || [],
        stressFactors: userData.stressFactors || [],
        sleepGoal: userData.sleepGoal || '8',
        waterGoal: userData.waterGoal || '3'
      });
    }
  }, [userData]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdating(true);
    setStatus('idle');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        age: parseInt(formData.age.toString()),
        height: parseFloat(formData.height.toString()),
        weight: parseFloat(formData.weight.toString()),
        sleepGoal: parseFloat(formData.sleepGoal.toString()),
        waterGoal: parseFloat(formData.waterGoal.toString()),
        lastCheckedAt: new Date().toISOString()
      });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Update failed:', error);
      setStatus('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = () => {
    signOut(auth).then(() => {
      window.location.hash = '/';
    });
  };

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary' },
    { value: 'lightly-active', label: 'Lightly Active' },
    { value: 'moderately-active', label: 'Moderately Active' },
    { value: 'very-active', label: 'Very Active' },
    { value: 'extra-active', label: 'Extra Active' }
  ];

  if (!userData) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Col: User Card */}
        <div className="space-y-8">
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 text-center">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-[32px] bg-primary/10 flex items-center justify-center text-primary text-4xl font-black overflow-hidden border-4 border-white shadow-lg">
                {userData.photoURL ? (
                  <img src={userData.photoURL} alt={userData.displayName} className="w-full h-full object-cover" />
                ) : (
                  userData.displayName?.charAt(0)
                )}
              </div>
              <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center text-gray-500 hover:text-primary transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 mb-1">{userData.displayName}</h2>
            <p className="text-gray-400 font-medium text-sm mb-6">{userData.email}</p>
            
            <div className="flex justify-center gap-4">
              <div className="bg-primary/5 px-4 py-2 rounded-2xl">
                <span className="block text-[10px] font-black uppercase tracking-widest text-primary/60">Zen Points</span>
                <span className="text-xl font-black text-primary">{userData.zenPoints || 0}</span>
              </div>
              <div className="bg-secondary/5 px-4 py-2 rounded-2xl">
                <span className="block text-[10px] font-black uppercase tracking-widest text-secondary/60">Level</span>
                <span className="text-xl font-black text-secondary">Pro</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-[40px] p-8 text-white space-y-6">
            <h3 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Privacy & Security
            </h3>
            <p className="text-gray-400 text-sm font-medium">Your personal health metrics are encrypted and never shared with 3rd parties.</p>
            <button 
              onClick={handleSignOut}
              className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Right Col: Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdate} className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-8 md:p-12 space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">Profile Settings</h1>
                  <p className="text-gray-500 font-medium text-sm">Keep your wellness data up to date.</p>
                </div>
              </div>

              {status === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-emerald-500 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Saved!</span>
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Display Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                  <input 
                    type="text"
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Gender</label>
                <select 
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900 appearance-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Height (cm)</label>
                <div className="relative">
                  <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
                  <input 
                    type="number"
                    value={formData.height}
                    onChange={e => setFormData({ ...formData, height: e.target.value })}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Weight (kg)</label>
                <div className="relative">
                  <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 w-5 h-5" />
                  <input 
                    type="number"
                    value={formData.weight}
                    onChange={e => setFormData({ ...formData, weight: e.target.value })}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all font-medium text-gray-900"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Blood Group</label>
                <div className="relative">
                  <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />
                  <select 
                    value={formData.bloodGroup}
                    onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-4 focus:ring-red-500/10 transition-all font-medium text-gray-900 appearance-none"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Activity Level</label>
                <div className="relative">
                  <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
                  <select 
                    value={formData.activityLevel}
                    onChange={e => setFormData({ ...formData, activityLevel: e.target.value })}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-900 appearance-none"
                  >
                    {activityLevels.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Sleep Goal (hrs)</label>
                <input 
                  type="number"
                  value={formData.sleepGoal}
                  onChange={e => setFormData({ ...formData, sleepGoal: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Water Goal (L)</label>
                <input 
                  type="number"
                  step="0.5"
                  value={formData.waterGoal}
                  onChange={e => setFormData({ ...formData, waterGoal: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-3xl focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900"
                />
              </div>
            </div>

            <div className="pt-8 border-t border-gray-50">
              <button 
                type="submit"
                disabled={isUpdating}
                className="w-full md:w-auto px-12 py-5 bg-primary text-white rounded-3xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
              >
                {isUpdating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Save All Changes <CheckCircle2 className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

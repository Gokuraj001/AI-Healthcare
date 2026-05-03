import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dna, 
  User as UserIcon, 
  Weight, 
  Ruler, 
  Heart, 
  Activity, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Calendar
} from 'lucide-react';

const Onboarding: React.FC = () => {
  const { user, userData } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userData?.displayName || '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    bloodGroup: '',
    activityLevel: 'moderately-active',
    healthGoals: [] as string[],
    stressFactors: [] as string[],
    sleepGoal: '8',
    waterGoal: '3'
  });

  const goalsOptions = [
    'Reduce Stress',
    'Improve Sleep',
    'Better Focus',
    'Physical Fitness',
    'Mental Clarity',
    'Social Wellness',
    'Anxiety Management'
  ];

  const stressOptions = [
    'Work pressure',
    'Financial worries',
    'Relationship issues',
    'Health concerns',
    'Academic stress',
    'Social anxiety',
    'Lack of sleep'
  ];

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        age: parseInt(formData.age),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        sleepGoal: parseFloat(formData.sleepGoal),
        waterGoal: parseFloat(formData.waterGoal),
        onboardingCompleted: true,
        lastCheckedAt: new Date().toISOString()
      });
      window.location.hash = '/dashboard';
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      healthGoals: prev.healthGoals.includes(goal)
        ? prev.healthGoals.filter(g => g !== goal)
        : [...prev.healthGoals, goal]
    }));
  };

  const toggleStress = (factor: string) => {
    setFormData(prev => ({
      ...prev,
      stressFactors: prev.stressFactors.includes(factor)
        ? prev.stressFactors.filter(f => f !== factor)
        : [...prev.stressFactors, factor]
    }));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden relative border border-white">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gray-100">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight">Let's get to know you.</h2>
                  <p className="text-gray-500 font-medium text-lg">Help us personalize your wellness journey.</p>
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                      <input 
                        type="text"
                        value={formData.displayName}
                        onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900"
                        placeholder="Your name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Age</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                        <input 
                          type="number"
                          value={formData.age}
                          onChange={e => setFormData({ ...formData, age: e.target.value })}
                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900"
                          placeholder="Your age"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Gender</label>
                      <select 
                        value={formData.gender}
                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900 appearance-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleNext}
                    disabled={!formData.displayName || !formData.age || !formData.gender}
                    className="group bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Next <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight">Health Metrics</h2>
                  <p className="text-gray-500 font-medium text-lg">These help us tailor physical exercises.</p>
                </div>

                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Height (cm)</label>
                      <div className="relative">
                        <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-5 h-5" />
                        <input 
                          type="number"
                          value={formData.height}
                          onChange={e => setFormData({ ...formData, height: e.target.value })}
                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-gray-900"
                          placeholder="e.g., 175"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Weight (kg)</label>
                      <div className="relative">
                        <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 w-5 h-5" />
                        <input 
                          type="number"
                          value={formData.weight}
                          onChange={e => setFormData({ ...formData, weight: e.target.value })}
                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all font-medium text-gray-900"
                          placeholder="e.g., 70"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Blood Group</label>
                      <div className="relative">
                        <Heart className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />
                        <select 
                          value={formData.bloodGroup}
                          onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-500/10 transition-all font-medium text-gray-900 appearance-none"
                        >
                          <option value="">Select</option>
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

                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Activity Level</label>
                      <div className="relative">
                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5" />
                        <select 
                          value={formData.activityLevel}
                          onChange={e => setFormData({ ...formData, activityLevel: e.target.value })}
                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-gray-900 appearance-none"
                        >
                          <option value="sedentary">Sedentary</option>
                          <option value="lightly-active">Lightly Active</option>
                          <option value="moderately-active">Moderately Active</option>
                          <option value="very-active">Very Active</option>
                          <option value="extra-active">Extra Active</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button 
                    onClick={handleBack}
                    className="bg-gray-100 text-gray-600 px-6 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-200 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" /> Back
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={!formData.height || !formData.weight || !formData.bloodGroup}
                    className="group bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Next <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight">Lifestyle</h2>
                  <p className="text-gray-500 font-medium text-lg">Help us understand your current routine.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Sleep Goal (hrs)</label>
                    <input 
                      type="number"
                      value={formData.sleepGoal}
                      onChange={e => setFormData({ ...formData, sleepGoal: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Water Goal (L)</label>
                    <input 
                      type="number"
                      step="0.5"
                      value={formData.waterGoal}
                      onChange={e => setFormData({ ...formData, waterGoal: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all font-medium text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Stress Factors</label>
                  <div className="flex flex-wrap gap-2">
                    {stressOptions.map(factor => (
                      <button
                        key={factor}
                        onClick={() => toggleStress(factor)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          formData.stressFactors.includes(factor)
                            ? 'bg-rose-500 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {factor}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button 
                    onClick={handleBack}
                    className="bg-gray-100 text-gray-600 px-6 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-200 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" /> Back
                  </button>
                  <button 
                    onClick={handleNext}
                    className="group bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                  >
                    Next <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight">Your Goals</h2>
                  <p className="text-gray-500 font-medium text-lg">Select what matters most to you.</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {goalsOptions.map(goal => (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                        formData.healthGoals.includes(goal)
                          ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {formData.healthGoals.includes(goal) && <CheckCircle2 className="w-4 h-4 inline-block mr-2" />}
                      {goal}
                    </button>
                  ))}
                </div>

                <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                      <Dna className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest">Our Commitment</h4>
                      <p className="text-gray-500 text-sm font-medium">Your health data is used only to personalize your experience and is kept strictly private.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button 
                    onClick={handleBack}
                    className="bg-gray-100 text-gray-600 px-6 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-200 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" /> Back
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={loading || formData.healthGoals.length === 0}
                    className="bg-primary text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 min-w-[160px]"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Complete Setup <CheckCircle2 className="w-5 h-5" /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

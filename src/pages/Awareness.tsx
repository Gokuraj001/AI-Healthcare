import React, { useState } from 'react';
import { Card, SectionTitle, Button } from '../components/UI';
import { 
  BookOpen, 
  Phone, 
  Heart, 
  ExternalLink,
  Brain,
  Wind,
  ShieldCheck,
  Video,
  X,
  Eye,
  Hand,
  Ear,
  Leaf,
  Coffee,
  Moon,
  Clock,
  Smartphone,
  Thermometer,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Awareness: React.FC = () => {
  const [activeGuide, setActiveGuide] = useState<'grounding' | 'sleep' | null>(null);
  const articles = [
    {
      title: "Understanding Anxiety",
      desc: "Anxiety is more than just feeling stressed. Learn about its symptoms and how it affects the brain.",
      tag: "Education",
      icon: Brain,
      color: "bg-blue-100 text-blue-600",
      url: "https://www.psychiatry.org/patients-families/anxiety-disorders/what-are-anxiety-disorders"
    },
    {
      title: "Breathing Techniques for Calm",
      desc: "Simple box breathing and 4-7-8 techniques you can use anywhere to reduce immediate stress.",
      tag: "Coping",
      icon: Wind,
      color: "bg-green-100 text-green-600",
      url: "https://www.healthline.com/health/breathing-exercise"
    },
    {
      title: "When to seek professional help",
      desc: "Identifying the threshold where self-care needs a professional's guidance.",
      tag: "Support",
      icon: ShieldCheck,
      color: "bg-purple-100 text-purple-600",
      url: "https://www.mhanational.org/finding-help-when-get-it-where-go"
    },
    {
      title: "Self-Care Strategies",
      desc: "Practical ways to maintain your mental well-being through daily habits and mindfulness.",
      tag: "Self-Care",
      icon: Heart,
      color: "bg-pink-100 text-pink-600",
      url: "https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health"
    }
  ];

  const helplines = [
    { name: "Tele Manas (Govt)", contact: "14416 / 1-800-891-4416", desc: "Mental Health Support (24/7)" },
    { name: "Vandrevala Foundation", contact: "+91 9999 666 555", desc: "Counselling Support (24/7)" },
    { name: "AASRA", contact: "022-27546669 / 7382053730", desc: "Suicide Prevention (24/7)" },
    { name: "KIRAN Helpline", contact: "1800-599-0019", desc: "Rehab & Support (24/7)" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <SectionTitle 
            title="Mental Health Awareness" 
            subtitle="Educate yourself and learn new ways to manage your well-being."
          />

          <div className="grid md:grid-cols-2 gap-8">
            {articles.map((art, i) => (
              <Card 
                key={i} 
                className="hover:shadow-xl transition-all cursor-pointer group p-0 overflow-hidden"
                onClick={() => window.open(art.url, '_blank')}
              >
                <div className="p-8">
                   <div className={`${art.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <art.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{art.tag}</span>
                  <h3 className="text-2xl font-extrabold text-gray-800 mt-2 mb-4 leading-tight">{art.title}</h3>
                  <p className="text-gray-500 font-medium leading-relaxed mb-6">{art.desc}</p>
                  <a 
                    href={art.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-0 flex items-center gap-2 text-primary font-bold hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Keep Reading <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </Card>
            ))}
          </div>

          <Card className="bg-primary text-white p-12 text-center rounded-[3rem] relative overflow-hidden">
             <Video className="absolute -top-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
             <h3 className="text-3xl font-bold mb-4">Recommended Exercises</h3>
             <p className="text-white/80 mb-8 max-w-lg mx-auto font-medium">Watch guided meditation and mindfulness exercises curated for you.</p>
             <div className="flex justify-center flex-wrap gap-4">
                <Button 
                  variant="secondary" 
                  className="px-8 py-3"
                  onClick={() => setActiveGuide('grounding')}
                >
                  5m Grounding Session
                </Button>
                <Button 
                  variant="secondary" 
                  className="px-8 py-3"
                  onClick={() => setActiveGuide('sleep')}
                >
                  Deep Sleep Guide
                </Button>
             </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-8 border-2 border-red-50 bg-red-50/20">
            <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <Phone className="w-6 h-6 text-red-500" />
              Emergency Help
            </h3>
            <div className="space-y-4">
              {helplines.map((h, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-red-100 hover:shadow-md transition-all">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{h.name}</p>
                  <p className="text-2xl font-black text-primary mb-1 font-mono">{h.contact}</p>
                  <p className="text-gray-500 text-sm font-medium">{h.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 p-6 bg-red-500 rounded-3xl text-white text-center">
               <Heart className="w-8 h-8 mx-auto mb-4 fill-current text-white/40" />
               <p className="text-lg font-bold">You are loved.</p>
               <p className="text-sm opacity-80 mt-1 font-medium">Reach out, people care.</p>
            </div>
          </Card>

          <Card className="p-8">
             <h3 className="text-xl font-bold mb-6">Daily Affirmations</h3>
             <div className="space-y-4 font-serif italic text-gray-600">
                <p>"I choose peace over stress."</p>
                <hr className="border-gray-50" />
                <p>"My feelings are valid."</p>
                <hr className="border-gray-50" />
                <p>"I am enough, just as I am."</p>
             </div>
          </Card>
        </div>
      </div>

      {/* Research Articles Section */}
      <section className="mt-20 border-t pt-16">
        <div className="flex items-center gap-4 mb-10">
          <BookOpen className="w-8 h-8 text-primary" />
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Research & Insights</h2>
            <p className="text-gray-500 font-medium tracking-tight">Staying informed with latest scientific findings on mental health.</p>
          </div>
        </div>

        <div className="flex overflow-x-auto pb-8 gap-6 no-scrollbar snap-x">
          {researchArticles.map((article, i) => (
            <div 
              key={i} 
              className="min-w-[400px] max-w-[400px] snap-center bg-gray-50 hover:bg-white border rounded-[32px] p-8 transition-all hover:shadow-xl group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
              
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border shadow-sm shrink-0">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-black text-gray-900 text-lg leading-tight group-hover:text-primary transition-colors">{article.title}</h4>
                  <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">{article.author}</p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                <p className="text-gray-600 font-medium leading-relaxed italic text-sm">
                  "{article.summary}"
                </p>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-black text-primary hover:text-primary/80 transition-colors uppercase tracking-tighter"
                >
                  <ExternalLink className="w-3 h-3" />
                  Read full paper
                </a>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{article.date}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {activeGuide === 'grounding' && (
          <GuideModal onClose={() => setActiveGuide(null)} title="5-4-3-2-1 Grounding Technique">
            <div className="space-y-6">
              <div className="aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-gray-50 mb-6">
                <iframe 
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/30VMIEmA11w" 
                  title="5-4-3-2-1 Grounding Technique Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                ></iframe>
              </div>

              <p className="text-gray-500 font-medium text-lg leading-relaxed">
                When you feel overwhelmed or anxious, this technique helps bring you back to the present moment by engaging all five senses.
              </p>
              
              <div className="grid gap-4">
                {[
                  { icon: Eye, count: 5, action: "Identify things you can SEE", items: "Look for small details you wouldn't normally notice — a pattern on the wall, a shadow, or a speck of dust.", color: "text-blue-500 bg-blue-50" },
                  { icon: Hand, count: 4, action: "Identify things you can TOUCH", items: "Focus on the texture of your clothes, the coolness of a surface, or the feeling of your feet on the floor.", color: "text-emerald-500 bg-emerald-50" },
                  { icon: Ear, count: 3, action: "Identify things you can HEAR", items: "Listen for distant traffic, a ticking clock, or the sound of your own breathing.", color: "text-purple-500 bg-purple-50" },
                  { icon: Leaf, count: 2, action: "Identify things you can SMELL", items: "Try to pick up on the scent of coffee, old books, or the fresh air outside.", color: "text-orange-500 bg-orange-50" },
                  { icon: Coffee, count: 1, action: "Identify thing you can TASTE", items: "Focus on the lingering taste of your last meal, or simply the neutral taste in your mouth.", color: "text-rose-500 bg-rose-50" },
                ].map((item, i) => (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="flex items-start gap-4 p-4 rounded-3xl border bg-white/50"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="font-black text-gray-900 flex items-center gap-2">
                        <span className="text-xl">{item.count}</span> {item.action}
                      </h5>
                      <p className="text-sm text-gray-500 font-medium leading-relaxed mt-1">{item.items}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="pt-4">
                <Button className="w-full rounded-2xl h-14 text-lg" onClick={() => setActiveGuide(null)}>I feel more grounded now</Button>
              </div>
            </div>
          </GuideModal>
        )}

        {activeGuide === 'sleep' && (
          <GuideModal onClose={() => setActiveGuide(null)} title="Ultimate Deep Sleep Guide">
            <div className="space-y-8">
              <div className="aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-gray-50">
                <iframe 
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/5GSeWdjyr1c" 
                  title="15 Minute Guided Meditation for Sleep"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                ></iframe>
              </div>

              <div className="space-y-6">
                <h4 className="text-xl font-black text-gray-900 border-l-4 border-primary pl-4">The Golden Routine</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Smartphone, title: "Digital Zero", time: "60m before", desc: "No blue light." },
                    { icon: Thermometer, title: "Cool Room", time: "18-20°C", desc: "Optimal temp." },
                    { icon: Clock, title: "Consistent", time: "Same hour", desc: "Circadian rhythm." },
                    { icon: Zap, title: "Release", time: "Stretching", desc: "Ease tension." }
                  ].map((item, i) => (
                    <div key={i} className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                      <item.icon className="w-6 h-6 text-primary mb-3" />
                      <p className="font-black text-gray-900 text-sm">{item.title}</p>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">{item.time}</p>
                      <p className="text-xs text-gray-400 font-medium mt-2">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="p-8 bg-blue-50 rounded-[2rem] border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <Moon className="w-6 h-6 text-blue-600" />
                    <h5 className="font-black text-blue-900">4-7-8 Sleep Breathing</h5>
                  </div>
                  <ol className="space-y-4">
                    {[
                      { step: "Inhale through nose for 4 seconds.", color: "text-blue-700" },
                      { step: "Hold your breath for 7 seconds.", color: "text-blue-800" },
                      { step: "Exhale through mouth for 8 seconds.", color: "text-blue-900" }
                    ].map((s, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">{i+1}</span>
                        <p className={`text-sm font-medium ${s.color}`}>{s.step}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <Button variant="outline" className="w-full rounded-2xl h-14" onClick={() => setActiveGuide(null)}>Close Guide</Button>
            </div>
          </GuideModal>
        )}
      </AnimatePresence>
    </div>
  );
};

const GuideModal: React.FC<{ 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode 
}> = ({ onClose, title, children }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-8 flex items-center justify-between border-b bg-white sticky top-0 z-10">
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <div className="p-8 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const researchArticles = [
  {
    title: "How Depression Affects Our Life",
    author: "World Health Organization",
    summary: "Depression is a leading cause of disability worldwide. It can cause the affected person to suffer greatly and function poorly at work, at school and in the family.",
    date: "March 2024",
    url: "https://www.who.int/news-room/fact-sheets/detail/depression"
  },
  {
    title: "Why Anxiety Happens: The Evolutionary View",
    author: "National Institutes of Health",
    summary: "An evolutionary perspective suggests that anxiety is a functional response to threat, but becomes a disorder when the system is hypersensitive.",
    date: "Feb 2024",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3684250/"
  },
  {
    title: "Depressive Disorder (Major Depression)",
    author: "NIMH",
    summary: "Major depression is one of the most common mental disorders in the United States, causing severe symptoms that affect how you feel, think, and handle daily activities.",
    date: "Jan 2024",
    url: "https://www.nimh.nih.gov/health/topics/depression"
  },
  {
    title: "Depression - Latest Research and News",
    author: "Nature Portfolio",
    summary: "Explore the latest research findings in depression, covering neurobiology, clinical trials, and innovative therapeutic interventions.",
    date: "April 2024",
    url: "https://www.nature.com/subjects/depression"
  },
  {
    title: "What Causes Depression?",
    author: "Harvard Health Publishing",
    summary: "Research suggests that depression doesn't spring from simply having too much or too little of certain brain chemicals. It's much more complex.",
    date: "March 2024",
    url: "https://www.health.harvard.edu/mind-and-mood/what-causes-depression"
  },
  {
    title: "The Link between Gut Health and Mental State",
    author: "Harvard Medical School",
    summary: "The gut-brain connection is no joke; it's a two-way street. A troubled intestine can send signals to the brain, just as a troubled brain can send signals to the gut.",
    date: "April 2024",
    url: "https://www.health.harvard.edu/staying-healthy/the-gut-brain-connection"
  },
  {
    title: "Sleep's Impact on Emotional Regulation",
    author: "Sleep Foundation",
    summary: "There is a bidirectional relationship between sleep and mental health. Sleep deprivation affects the psychological state and mental health.",
    date: "Dec 2023",
    url: "https://www.sleepfoundation.org/mental-health/emotional-regulation-and-sleep"
  },
  {
    title: "Social Media and Loneliness Research",
    author: "Penn Today",
    summary: "University of Pennsylvania psychologists have shown for the first time a causal link between time spent on social media and decreased well-being.",
    date: "May 2024",
    url: "https://penntoday.upenn.edu/news/social-media-use-increases-depression-and-loneliness"
  }
];

export default Awareness;

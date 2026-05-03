import React from 'react';
import { Button } from '../components/UI';
import { motion } from 'motion/react';
import { Shield, MessageCircle, Heart, Sparkles, Brain, ArrowRight } from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-32 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-primary font-bold text-sm mb-8"
        >
          <Sparkles className="w-4 h-4" />
          Powered by Generative AI
        </motion.div>
        
        <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Your Companion for <br />
          <span className="text-primary italic">Mental Peace</span>
        </h1>
        
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          MindCare AI provides personalized support, mood tracking, and a supportive community 
          to help you navigate life's challenges with resilience.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" onClick={() => window.location.hash = '/auth'}>
            Start Your Journey 
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => window.location.hash = '/awareness'}>
            Explore Resources
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-40 -left-20 w-64 h-64 bg-calm-blue/30 rounded-full blur-3xl -z-10" />
        <div className="absolute top-20 -right-20 w-80 h-80 bg-calm-purple/30 rounded-full blur-3xl -z-10" />
      </section>

      {/* Features Grid */}
      <section className="bg-white py-24 border-y">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: Brain,
                title: "Sentiment Analysis",
                desc: "Our AI analyzes your journal entries to detect emotional trends and potential risks early.",
                color: "bg-calm-blue"
              },
              {
                icon: MessageCircle,
                title: "AI Therapy Assistant",
                desc: "An empathetic chatbot available 24/7 to listen, suggest exercises, and support you.",
                color: "bg-calm-purple"
              },
              {
                icon: Shield,
                title: "Safety First",
                desc: "Built-in risk detection triggers immediate emergency alerts and local helpline support.",
                color: "bg-calm-pink"
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center p-8 rounded-3xl hover:shadow-xl transition-all border border-transparent hover:border-gray-100"
              >
                <div className={`${f.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner`}>
                  <f.icon className="w-8 h-8 text-gray-700" />
                </div>
                <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4">
        <div className="max-w-5xl mx-auto bg-primary rounded-3xl p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/30">
          <Heart className="absolute -top-10 -right-10 w-64 h-64 text-white/5 rotate-12" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Mental health matters. <br /> Start caring for yours today.</h2>
          <p className="text-white/80 text-xl max-w-xl mx-auto mb-10">
            Join thousands who are using MindCare AI to find balance and strength every single day.
          </p>
          <Button size="lg" variant="secondary" onClick={() => window.location.hash = '/auth'} className="px-10 py-5 text-lg">
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t text-center text-gray-400 font-medium">
        <p>&copy; 2026 MindCare AI. Built with ❤️ for everyone.</p>
      </footer>
    </div>
  );
};

export default Landing;

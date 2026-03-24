import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, RefreshCw, Wand2 } from 'lucide-react';
import type { Profile } from '@/store/appStore';

interface IcebreakerModalProps {
  profile: Profile;
  onSelect: (text: string) => void;
  onClose: () => void;
}

export default function IcebreakerModal({ profile, onSelect, onClose }: IcebreakerModalProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const generateIcebreakers = () => {
    setLoading(true);
    // In a real app, this would call an AI API (like Gemini/OpenAI)
    // For now, we simulate based on profile data
    setTimeout(() => {
      const interests = profile.interests.slice(0, 2).join(' i ');
      const city = profile.city;
      
      const prompts = [
        `Hej ${profile.displayName}! Widzę, że interesujesz się ${interests}. Ja też! Masz jakieś ulubione miejsca z tym związane w ${city}?`,
        `Cześć! Twój opis o "${profile.bio.slice(0, 20)}..." bardzo mnie zaciekawił. Myślę, że mamy podobne vibe'y ✨`,
        `Masz świetne zdjęcia! Szczególnie to pierwsze. Często bywasz w ${city}?`,
        `Dopasowało nas na ${profile.chemistryScore}%, to chyba znak, że musimy pogadać! Od czego zaczynamy? 😜`,
      ];
      
      setSuggestions(prompts.sort(() => Math.random() - 0.5).slice(0, 3));
      setLoading(false);
    }, 1200);
  };

  useEffect(() => {
    generateIcebreakers();
  }, [profile]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-md flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-sm glass-strong rounded-[32px] overflow-hidden border border-primary/20 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 gradient-fire rounded-xl flex items-center justify-center shadow-lg">
                <Wand2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-black text-lg">AI Spark</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Personalizowane Icebreakery</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 glass rounded-full flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 mb-6">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-20 glass rounded-2xl animate-pulse flex items-center px-4">
                  <div className="h-3 w-full bg-primary/10 rounded-full" />
                </div>
              ))
            ) : (
              suggestions.map((text, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => onSelect(text)}
                  className="w-full text-left glass hover:bg-primary/5 p-4 rounded-2xl border border-border/40 hover:border-primary/40 transition-all group active:scale-[0.98]"
                >
                  <p className="text-sm leading-relaxed text-foreground/90 group-hover:text-foreground transition-colors">{text}</p>
                  <div className="flex justify-end mt-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                      <Send className="w-3 h-3 text-primary group-hover:text-primary-foreground" />
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </div>

          <button
            onClick={generateIcebreakers}
            disabled={loading}
            className="w-full py-4 glass rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Inne propozycje
          </button>
        </div>
        
        <div className="bg-primary/5 p-4 text-center border-t border-primary/10">
          <p className="text-[10px] text-primary/60 font-medium">Spark Connect AI · Pomagamy przełamać lody ❄️🔨</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

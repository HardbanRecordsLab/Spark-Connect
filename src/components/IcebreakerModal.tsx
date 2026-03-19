import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Shuffle, Send } from 'lucide-react';
import type { Profile } from '@/store/appStore';

const ICEBREAKERS_BY_INTEREST: Record<string, string[]> = {
  Travel: [
    'Gdzie jest jedno miejsce na świecie które absolutnie musisz odwiedzić? 🌍',
    'Najlepsza podróż w Twoim życiu — gdzie i dlaczego? ✈️',
    'Plaża czy góry na spontaniczny wyjazd? 🏖️🏔️',
  ],
  Music: [
    'Jeden artysta, jeden koncert na żywo — kogo wybrać? 🎵',
    'Jaką piosenkę słuchasz na repeat w tym tygodniu?',
    'Gdybyś miał/a swój własny soundtrack życia — jakie są pierwsze 3 utwory? 🎸',
  ],
  Gaming: [
    'Co grasz ostatnio — i czy polecasz? 🎮',
    'Nostalgiczna gra z dzieciństwa którą zagrałbyś/abyś teraz?',
    'Gdybyś mógł/a żyć w świecie jakiejś gry — w którym?',
  ],
  default: [
    'Co ostatnio Cię zaskoczyło w pozytywny sposób? 😊',
    'Jaki jest Twój ulubiony sposób na spędzenie wolnej soboty?',
    'Gdybyś jutro miał/a wolny dzień — co byś zrobił/a? 🌅',
    'Ostatnia rzecz która sprawiła że się śmiałeś/aś do łez? 😂',
    'Co jest dla Ciebie ważniejsze w rozmowie — szczerość czy takt?',
    'Herbata czy kawa — i jak lubisz przygotowaną? ☕',
  ],
};

function getIcebreakers(interests: string[]): string[] {
  const results: string[] = [];
  for (const interest of interests) {
    const list = ICEBREAKERS_BY_INTEREST[interest];
    if (list) results.push(list[Math.floor(Math.random() * list.length)]);
    if (results.length >= 2) break;
  }
  while (results.length < 3) {
    const defaults = ICEBREAKERS_BY_INTEREST['default'];
    const pick = defaults[Math.floor(Math.random() * defaults.length)];
    if (!results.includes(pick)) results.push(pick);
  }
  return results.slice(0, 3);
}

interface IcebreakerModalProps {
  matchedProfile: Profile;
  onSend: (message: string) => void;
  onClose: () => void;
}

export default function IcebreakerModal({ matchedProfile, onSend, onClose }: IcebreakerModalProps) {
  const [questions, setQuestions] = useState(() => getIcebreakers(matchedProfile.interests));
  const [selected, setSelected] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');

  const handleShuffle = () => {
    setQuestions(getIcebreakers(matchedProfile.interests));
    setSelected(null);
  };

  const handleSend = () => {
    const msg = selected || customText.trim();
    if (!msg) return;
    onSend(msg);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full bg-card rounded-t-3xl pb-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-5 pt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h2 className="font-bold">Zacznij rozmowę!</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 glass rounded-full flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-5">
            Dopasowałeś/aś się z <span className="text-primary font-semibold">{matchedProfile.displayName}</span>. Wybierz pytanie lub napisz własne!
          </p>

          {/* Icebreaker cards */}
          <div className="space-y-2.5 mb-4">
            {questions.map((q, i) => (
              <motion.button
                key={q}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setSelected(selected === q ? null : q)}
                className={`w-full text-left p-3.5 rounded-2xl text-sm leading-relaxed transition-all border ${
                  selected === q
                    ? 'gradient-fire text-primary-foreground border-transparent'
                    : 'glass border-border hover:border-primary/30'
                }`}
              >
                {q}
              </motion.button>
            ))}
          </div>

          {/* Shuffle */}
          <button
            onClick={handleShuffle}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-4 mx-auto"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Losuj inne pytania
          </button>

          {/* Custom input */}
          <div className="flex items-center gap-2 glass rounded-2xl px-4 py-2.5 mb-4 border border-border focus-within:border-primary/30 transition-colors">
            <input
              value={customText}
              onChange={e => { setCustomText(e.target.value); setSelected(null); }}
              placeholder="Albo napisz własną wiadomość..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!selected && !customText.trim()}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
              selected || customText.trim()
                ? 'gradient-fire text-primary-foreground glow-red'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            Wyślij i zacznij rozmowę
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

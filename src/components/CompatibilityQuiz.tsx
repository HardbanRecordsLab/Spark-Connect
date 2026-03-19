import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, ChevronRight, Sparkles, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface Question {
  id: string;
  text: string;
  emoji: string;
  options: { value: string; label: string; score: number }[];
  category: 'energy' | 'style' | 'communication' | 'openness';
}

const QUESTIONS: Question[] = [
  {
    id: 'q1', emoji: '⚡', category: 'energy',
    text: 'Jak często lubisz spotykać się z partnerem/ką?',
    options: [
      { value: 'daily',    label: 'Codziennie — jestem bardzo namiętny/a',       score: 4 },
      { value: 'often',    label: 'Kilka razy w tygodniu',                        score: 3 },
      { value: 'weekly',   label: 'Raz w tygodniu — jakość > ilość',              score: 2 },
      { value: 'casual',   label: 'Kiedy mam ochotę — bez zobowiązań',            score: 1 },
    ],
  },
  {
    id: 'q2', emoji: '🌙', category: 'style',
    text: 'Preferujesz...',
    options: [
      { value: 'spontan',  label: 'Spontaniczne — bez planowania',                score: 4 },
      { value: 'planned',  label: 'Zaplanowane — klimat i nastrój mają znaczenie', score: 3 },
      { value: 'both',     label: 'Zależy od nastroju',                            score: 2 },
      { value: 'doesnt',   label: 'Nie mam preferencji',                           score: 1 },
    ],
  },
  {
    id: 'q3', emoji: '🗣️', category: 'communication',
    text: 'Jak otwarcie rozmawiasz o swoich pragnieniach?',
    options: [
      { value: 'very',     label: 'Bardzo otwarcie — szczerość przede wszystkim', score: 4 },
      { value: 'mostly',   label: 'Dość otwarcie, ale potrzeba czasu',             score: 3 },
      { value: 'hints',    label: 'Wolę dawać sygnały niż mówić wprost',          score: 2 },
      { value: 'shy',      label: 'Trudno mi o tym mówić',                         score: 1 },
    ],
  },
  {
    id: 'q4', emoji: '🎭', category: 'openness',
    text: 'Stosunek do nowych doświadczeń?',
    options: [
      { value: 'explorer', label: 'Chętnie eksperymentuję — lubię nowości',       score: 4 },
      { value: 'open',     label: 'Jestem otwarty/a jeśli partner/ka proponuje',  score: 3 },
      { value: 'classic',  label: 'Wolę sprawdzone rzeczy',                        score: 2 },
      { value: 'no',       label: 'Wolę trzymać się tego co znam',                 score: 1 },
    ],
  },
  {
    id: 'q5', emoji: '💬', category: 'communication',
    text: 'Po seksie wolisz...',
    options: [
      { value: 'cuddle',   label: 'Przytulić się i porozmawiać',                  score: 4 },
      { value: 'relax',    label: 'Odpocząć razem w ciszy',                        score: 3 },
      { value: 'active',   label: 'Wstać i zająć się czymś',                       score: 2 },
      { value: 'leave',    label: 'Mieć swoje przestrzeń',                         score: 1 },
    ],
  },
  {
    id: 'q6', emoji: '🔥', category: 'energy',
    text: 'Kiedy najbardziej jesteś w nastroju?',
    options: [
      { value: 'night',    label: 'Wieczorem / w nocy 🌙',                        score: 4 },
      { value: 'morning',  label: 'Rano — świeżo po przebudzeniu ☀️',             score: 3 },
      { value: 'anytime',  label: 'O każdej porze',                                score: 2 },
      { value: 'rarely',   label: 'Rzadko — muszę być w dobrym nastroju',         score: 1 },
    ],
  },
  {
    id: 'q7', emoji: '💭', category: 'style',
    text: 'Ważniejsze dla Ciebie to...',
    options: [
      { value: 'emotional', label: 'Emocjonalne połączenie — intensywność uczuć', score: 4 },
      { value: 'physical',  label: 'Fizyczna chemia — namiętność',                score: 3 },
      { value: 'both',      label: 'Oba są równie ważne',                          score: 2 },
      { value: 'neither',   label: 'Szukam czegoś zupełnie innego',                score: 1 },
    ],
  },
  {
    id: 'q8', emoji: '🤫', category: 'openness',
    text: 'Stosunek do dyskrecji?',
    options: [
      { value: 'full',     label: 'Pełna dyskrecja — moje życie to moja prywatność', score: 4 },
      { value: 'mostly',   label: 'Raczej dyskretny/a',                               score: 3 },
      { value: 'open',     label: 'Nie ukrywam że szukam przygód',                    score: 2 },
      { value: 'public',   label: 'Jestem zupełnie otwarty/a',                        score: 1 },
    ],
  },
  {
    id: 'q9', emoji: '💝', category: 'communication',
    text: 'Co jest dla Ciebie kluczowe w spotkaniu?',
    options: [
      { value: 'trust',    label: 'Zaufanie i komfort — ważne żeby czuć się bezpiecznie', score: 4 },
      { value: 'chem',     label: 'Chemia — musi być to "coś"',                    score: 3 },
      { value: 'looks',    label: 'Atrakcja fizyczna',                              score: 2 },
      { value: 'fun',      label: 'Dobra zabawa i luz',                             score: 1 },
    ],
  },
  {
    id: 'q10', emoji: '🌈', category: 'openness',
    text: 'Twój idealny scenariusz to...',
    options: [
      { value: 'romantic', label: 'Romantyczna randka → noc razem',               score: 4 },
      { value: 'direct',   label: 'Poznajemy się → od razu wiemy o co chodzi',    score: 3 },
      { value: 'fwb',      label: 'Stały znajomy — spotykamy się kiedy mamy ochotę', score: 2 },
      { value: 'party',    label: 'Impreza → spontaniczne "co z tego wyjdzie"',   score: 1 },
    ],
  },
];

const TYPE_LABELS: Record<string, { title: string; desc: string; emoji: string; color: string }> = {
  'Płomień': {
    title: 'Płomień 🔥',
    desc: 'Intensywny/a, namiętny/a i otwarty/a. Szukasz autentycznej chemii i nie boisz się mówić wprost o tym czego chcesz.',
    emoji: '🔥',
    color: 'border-primary/40',
  },
  'Mgła': {
    title: 'Mgła 🌫️',
    desc: 'Tajemniczy/a i zmysłowy/a. Wolisz subtelność, ale gdy nawiążesz kontakt — intensywność jest niesamowita.',
    emoji: '🌫️',
    color: 'border-purple-500/40',
  },
  'Burza': {
    title: 'Burza ⚡',
    desc: 'Spontaniczny/a i nieprzewidywalny/a. Żyjesz chwilą i lubisz gdy wszystko dzieje się nagle.',
    emoji: '⚡',
    color: 'border-accent/40',
  },
  'Miód': {
    title: 'Miód 🍯',
    desc: 'Ciepły/a, zmysłowy/a i dbający/a o komfort partnera. Namiętność rośnie u Ciebie wraz z zaufaniem.',
    emoji: '🍯',
    color: 'border-amber-500/40',
  },
};

function getType(totalScore: number, categoryScores: Record<string, number>): string {
  const maxCat = Object.entries(categoryScores).sort((a, b) => b[1] - a[1])[0][0];
  if (totalScore >= 35) return 'Płomień';
  if (totalScore >= 28) return maxCat === 'openness' ? 'Burza' : 'Płomień';
  if (totalScore >= 20) return maxCat === 'communication' ? 'Miód' : 'Mgła';
  return 'Mgła';
}

interface CompatibilityQuizProps {
  onClose: () => void;
  onSave?: (type: string, score: number) => void;
}

export default function CompatibilityQuiz({ onClose, onSave }: CompatibilityQuizProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { value: string; score: number }>>({});
  const [saving, setSaving] = useState(false);

  const q = QUESTIONS[qIndex];
  const progress = ((qIndex + 1) / QUESTIONS.length) * 100;
  const answeredAll = Object.keys(answers).length === QUESTIONS.length;

  const totalScore = Object.values(answers).reduce((s, a) => s + a.score, 0);
  const categoryScores = QUESTIONS.reduce((acc, q) => {
    const ans = answers[q.id];
    if (ans) acc[q.category] = (acc[q.category] || 0) + ans.score;
    return acc;
  }, {} as Record<string, number>);
  const resultType = answeredAll ? getType(totalScore, categoryScores) : '';
  const typeInfo = TYPE_LABELS[resultType];

  const selectAnswer = (value: string, score: number) => {
    setAnswers(prev => ({ ...prev, [q.id]: { value, score } }));
    setTimeout(() => {
      if (qIndex < QUESTIONS.length - 1) {
        setQIndex(i => i + 1);
      } else {
        setStep('result');
      }
    }, 300);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await db.from('profiles').update({
      compatibility_type: resultType,
      compatibility_score: totalScore,
    }).eq('id', user.id);
    onSave?.(resultType, totalScore);
    setSaving(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 glass-strong border-b border-border">
        <button onClick={onClose} className="w-8 h-8 glass rounded-xl flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h2 className="font-bold">Quiz kompatybilności</h2>
          {step === 'quiz' && (
            <p className="text-xs text-muted-foreground">Pytanie {qIndex + 1} z {QUESTIONS.length}</p>
          )}
        </div>
        <Lock className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        <AnimatePresence mode="wait">

          {/* INTRO */}
          {step === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-full px-6 text-center py-12">
              <motion.div
                animate={{ rotate: [0, -5, 5, -5, 0], scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="text-6xl mb-6"
              >
                💘
              </motion.div>
              <h2 className="text-2xl font-black mb-3">Quiz kompatybilności 18+</h2>
              <p className="text-muted-foreground mb-6 max-w-xs leading-relaxed">
                10 pytań które ujawnią Twój typ seksualny. Wynik pojawi się na Twoim profilu jako wskaźnik dopasowania.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {['🔒 Prywatny', '⏱️ 2 minuty', '💯 Szczery wynik'].map(tag => (
                  <span key={tag} className="glass text-xs px-3 py-1.5 rounded-full text-muted-foreground">{tag}</span>
                ))}
              </div>
              <div className="space-y-3 w-full max-w-xs">
                <button onClick={() => setStep('quiz')}
                  className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red flex items-center justify-center gap-2">
                  Zacznij quiz <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="w-full glass py-3 rounded-2xl text-sm text-muted-foreground">
                  Może później
                </button>
              </div>
            </motion.div>
          )}

          {/* QUIZ */}
          {step === 'quiz' && (
            <motion.div key={`q-${qIndex}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="px-6 py-6">
              {/* Progress */}
              <div className="mb-6">
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full gradient-fire rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'spring', stiffness: 80 }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">{q.emoji}</div>
                <h3 className="text-xl font-black leading-snug">{q.text}</h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {q.options.map(opt => {
                  const selected = answers[q.id]?.value === opt.value;
                  return (
                    <motion.button
                      key={opt.value}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => selectAnswer(opt.value, opt.score)}
                      className={`w-full text-left p-4 rounded-2xl transition-all border ${
                        selected
                          ? 'gradient-fire text-primary-foreground border-transparent'
                          : 'glass border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selected ? 'bg-primary-foreground border-primary-foreground' : 'border-muted-foreground'
                        }`}>
                          {selected && <Check className="w-3 h-3 text-primary" />}
                        </div>
                        <span className="text-sm leading-relaxed">{opt.label}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Back nav */}
              {qIndex > 0 && (
                <button onClick={() => setQIndex(i => i - 1)}
                  className="mt-4 text-xs text-muted-foreground flex items-center gap-1 mx-auto">
                  ← Poprzednie pytanie
                </button>
              )}
            </motion.div>
          )}

          {/* RESULT */}
          {step === 'result' && typeInfo && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center min-h-full px-6 py-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                className="text-7xl mb-5"
              >
                {typeInfo.emoji}
              </motion.div>

              <h2 className="text-3xl font-black mb-2">Jesteś {typeInfo.title}</h2>
              <div className={`glass rounded-2xl p-5 border ${typeInfo.color} mb-6 max-w-xs`}>
                <p className="text-sm text-muted-foreground leading-relaxed">{typeInfo.desc}</p>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-8">
                {[
                  { key: 'energy', label: 'Energia', emoji: '⚡' },
                  { key: 'style', label: 'Styl', emoji: '🎭' },
                  { key: 'communication', label: 'Komunikacja', emoji: '💬' },
                  { key: 'openness', label: 'Otwartość', emoji: '🌈' },
                ].map(cat => {
                  const maxPossible = QUESTIONS.filter(q => q.category === cat.key).length * 4;
                  const score = categoryScores[cat.key] ?? 0;
                  const pct = Math.round((score / maxPossible) * 100);
                  return (
                    <div key={cat.key} className="glass rounded-xl p-3 text-left">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-sm">{cat.emoji}</span>
                        <span className="text-xs font-medium">{cat.label}</span>
                        <span className="ml-auto text-xs font-bold text-primary">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.4, duration: 0.8 }}
                          className="h-full gradient-fire rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button onClick={handleSave} disabled={saving}
                  className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving
                    ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <><Sparkles className="w-4 h-4" /> Zapisz na profilu</>}
                </button>
                <button onClick={onClose} className="w-full glass py-3 rounded-2xl text-sm text-muted-foreground">
                  Zamknij bez zapisywania
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}

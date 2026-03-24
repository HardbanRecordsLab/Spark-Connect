import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Radio } from 'lucide-react';

const GROUPS = [
  { id: 'g1', name: 'Jazz & Vinyl ♫', desc: 'Dla miłośników muzyki analogowej. Rekomendacje, nowości, spotkania w mieście.', emoji: '🎷', bg: 'linear-gradient(135deg,#0d0820,#1a0d35)', members: 847, joined: true, live: true, cat: 'Muzyka' },
  { id: 'g2', name: 'Kawa i filozofia ☕', desc: 'Poranne myśli, wielkie pytania. Codziennie nowy temat do dyskusji przy filiżance.', emoji: '☕', bg: 'linear-gradient(135deg,#0a0a00,#1a1800)', members: 1204, joined: true, live: false, cat: 'Lifestyle' },
  { id: 'g3', name: 'Kino Niezależne 🎬', desc: 'Arthouse, festiwale, recenzje. Dla tych którzy kochają film jako sztukę.', emoji: '🎬', bg: 'linear-gradient(135deg,#0a0512,#15082a)', members: 562, joined: false, live: false, cat: 'Film' },
  { id: 'g4', name: 'Bieganie Warszawa 🏃', desc: 'Wspólne treningi w Parku Łazienkowskim i Polu Mokotowskim. Każdy poziom.', emoji: '🏃', bg: 'linear-gradient(135deg,#001a08,#003018)', members: 389, joined: false, live: false, cat: 'Sport' },
  { id: 'g5', name: 'Wino & Sery 🍷', desc: 'Degustacje, rekomendacje, spotkania. Raz w miesiącu wspólne wieczory.', emoji: '🍷', bg: 'linear-gradient(135deg,#1a0008,#2a0012)', members: 213, joined: false, live: false, cat: 'Food' },
  { id: 'g6', name: 'Debata & Kultura 📚', desc: 'Tygodniowe debaty na tematy kulturalne, społeczne i filozoficzne.', emoji: '📚', bg: 'linear-gradient(135deg,#0a0a18,#18183a)', members: 491, joined: false, live: true, cat: 'Kultura' },
  { id: 'g7', name: 'Nocne Marki 🌙', desc: 'Dla sów. Rozmowy po północy, muzyka, dzielenie się przeżyciami dnia.', emoji: '🌙', bg: 'linear-gradient(135deg,#050510,#0d0d2a)', members: 733, joined: true, live: false, cat: 'Lifestyle' },
  { id: 'g8', name: 'Fotografia Uliczna 📸', desc: 'Sesje w mieście, krytyki zdjęć, inspiration. Wszyscy poziomy.', emoji: '📸', bg: 'linear-gradient(135deg,#101010,#1a1a1a)', members: 318, joined: false, live: false, cat: 'Kultura' },
];

const CATS = ['Wszystkie', 'Muzyka', 'Lifestyle', 'Film', 'Kultura', 'Sport', 'Food'];

interface GroupsPageProps {
  onOpenGroupChat: (name: string, emoji: string) => void;
}

export default function GroupsPage({ onOpenGroupChat }: GroupsPageProps) {
  const [activeCat, setActiveCat] = useState('Wszystkie');
  const [joined, setJoined] = useState<Record<string, boolean>>(
    Object.fromEntries(GROUPS.map(g => [g.id, g.joined]))
  );

  const filtered = activeCat === 'Wszystkie' ? GROUPS : GROUPS.filter(g => g.cat === activeCat);

  return (
    <div className="h-full overflow-y-auto scrollbar-hidden">
      {/* Hero */}
      <div className="mx-5 mt-4 mb-5 rounded-2xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(201,168,76,.1),rgba(180,100,200,.07))', border: '1px solid rgba(201,168,76,.22)' }}>
        <div className="absolute right-4 top-3 text-4xl opacity-10">✦</div>
        <h2 className="font-bold text-lg mb-1" style={{ fontFamily: 'serif', background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Znajdź swoich ludzi
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Dołącz do grup pasjonatów, dyskutuj i poznaj nowych ludzi o podobnych zainteresowaniach
        </p>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-5 mb-4 overflow-x-auto scrollbar-hidden">
        {CATS.map(cat => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeCat === cat
              ? 'bg-primary/15 text-primary border border-primary/40'
              : 'glass text-muted-foreground border border-border hover:border-primary/30'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Groups */}
      <div className="px-5 space-y-3 pb-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((g, i) => (
            <motion.div key={g.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl overflow-hidden border border-border/50 glass cursor-pointer hover:border-primary/30 transition-all"
              onClick={() => onOpenGroupChat(g.name, g.emoji)}>
              {/* Banner */}
              <div className="h-16 flex items-center justify-center relative text-3xl" style={{ background: g.bg }}>
                {g.emoji}
                {g.live && (
                  <div className="absolute top-2 left-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs text-primary/90 font-medium">Na żywo</span>
                  </div>
                )}
              </div>
              {/* Body */}
              <div className="p-3">
                <div className="font-semibold text-sm mb-1" style={{ fontFamily: 'serif' }}>{g.name}</div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{g.desc}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{g.members.toLocaleString()} osób</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setJoined(prev => ({ ...prev, [g.id]: !prev[g.id] })); }}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${joined[g.id]
                      ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'glass text-muted-foreground border border-border hover:border-primary/40 hover:text-primary'}`}>
                    {joined[g.id] ? '✓ Dołączono' : 'Dołącz'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

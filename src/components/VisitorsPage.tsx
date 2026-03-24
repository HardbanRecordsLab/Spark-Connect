import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VISITORS = [
  { img: 49, name: 'Sofia', age: 24, time: '2 min', liked: true, ver: true },
  { img: 47, name: 'Mia', age: 22, time: '15 min', liked: false, ver: false },
  { img: 45, name: 'Natalia', age: 27, time: '1 godz.', liked: true, ver: true },
  { img: 44, name: 'Zara', age: 23, time: '3 godz.', liked: false, ver: false },
  { img: 43, name: 'Julia', age: 25, time: '5 godz.', liked: false, ver: true },
  { img: 41, name: 'Emma', age: 26, time: 'wczoraj', liked: true, ver: false },
  { img: 46, name: 'Karolina', age: 28, time: 'wczoraj', liked: false, ver: true },
  { img: 42, name: 'Ola', age: 21, time: '2 dni', liked: false, ver: false },
  { img: 48, name: 'Wiktoria', age: 29, time: '3 dni', liked: true, ver: true },
  { img: 10, name: 'Marek', age: 31, time: '4 dni', liked: false, ver: true },
  { img: 11, name: 'Tomek', age: 27, time: '5 dni', liked: true, ver: false },
  { img: 12, name: 'Bartek', age: 25, time: '6 dni', liked: false, ver: false },
];

type Tab = 'all' | 'liked' | 'super';

interface VisitorsPageProps {
  onOpenChat: (name: string) => void;
}

export default function VisitorsPage({ onOpenChat }: VisitorsPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('all');

  const data = activeTab === 'liked'
    ? VISITORS.filter(v => v.liked)
    : activeTab === 'super'
    ? VISITORS.slice(0, 3)
    : VISITORS;

  const counts = { all: VISITORS.length, liked: VISITORS.filter(v => v.liked).length, super: 3 };

  return (
    <div className="h-full overflow-y-auto scrollbar-hidden">
      <div className="flex items-start justify-between px-5 pt-4 pb-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'serif' }}>Kto mnie odwiedził</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Wszyscy widoczni bezpłatnie ✦</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mx-5 mb-4 glass rounded-2xl p-1 border border-border">
        {([
          { id: 'all', label: 'Odwiedzili', count: counts.all },
          { id: 'liked', label: 'Polubili', count: counts.liked },
          { id: 'super', label: 'Super ⭐', count: counts.super },
        ] as { id: Tab; label: string; count: number }[]).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${activeTab === t.id
              ? 'bg-primary/15 text-primary border border-primary/30'
              : 'text-muted-foreground'}`}>
            {t.label} <span className={activeTab === t.id ? 'text-primary' : 'text-muted-foreground'}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2.5 px-5 pb-6">
        <AnimatePresence mode="popLayout">
          {data.map((v, i) => (
            <motion.div key={v.name + v.img}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.04 }}
              className="cursor-pointer group"
              onClick={() => onOpenChat(v.name)}>
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '0.75' }}>
                <img src={`https://i.pravatar.cc/150?img=${v.img}`} alt={v.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(5,5,12,.9) 0%,transparent 55%)' }} />
                {/* Time */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-lg text-xs"
                  style={{ background: 'rgba(10,10,15,.75)', color: 'rgba(255,255,255,.6)', fontSize: 9 }}>
                  {v.time}
                </div>
                {/* Verified */}
                {v.ver && (
                  <div className="absolute top-2 left-2 w-4 h-4 rounded-full flex items-center justify-center text-xs"
                    style={{ background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', fontSize: 8 }}>✓</div>
                )}
                {/* Heart (liked me) */}
                {v.liked && (
                  <div className="absolute w-5 h-5 rounded-full flex items-center justify-center text-xs border-2"
                    style={{ bottom: 26, right: 5, background: '#d4607a', borderColor: 'hsl(240 15% 4%)', fontSize: 10 }}>
                    ♥
                  </div>
                )}
                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <div className="text-xs font-semibold">{v.name}</div>
                  <div className="text-muted-foreground" style={{ fontSize: 10 }}>{v.age} lat</div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

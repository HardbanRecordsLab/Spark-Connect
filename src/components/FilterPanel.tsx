import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, Check } from 'lucide-react';

export interface DiscoverFilters {
  ageMin: number;
  ageMax: number;
  distanceMax: number;
  gender: string[];
  orientation: string[];
  moodStatus: string[];
  verifiedOnly: boolean;
}

export const DEFAULT_FILTERS: DiscoverFilters = {
  ageMin: 18,
  ageMax: 50,
  distanceMax: 50,
  gender: [],
  orientation: [],
  moodStatus: [],
  verifiedOnly: false,
};

const GENDERS = ['Female', 'Male', 'Non-binary', 'Other'];
const MOODS = ['Looking for fun', 'Just chatting', 'Serious only'];

interface FilterPanelProps {
  filters: DiscoverFilters;
  onApply: (f: DiscoverFilters) => void;
  onClose: () => void;
}

export default function FilterPanel({ filters, onApply, onClose }: FilterPanelProps) {
  const [draft, setDraft] = useState<DiscoverFilters>({ ...filters });

  const toggleArr = (key: keyof Pick<DiscoverFilters, 'gender' | 'orientation' | 'moodStatus'>, val: string) => {
    setDraft(prev => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  };

  const activeCount = [
    draft.ageMin !== 18 || draft.ageMax !== 50,
    draft.distanceMax !== 50,
    draft.gender.length > 0,
    draft.moodStatus.length > 0,
    draft.verifiedOnly,
  ].filter(Boolean).length;

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
        className="w-full bg-card rounded-t-3xl max-h-[85vh] overflow-y-auto scrollbar-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-8 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold">Filtry</h2>
              {activeCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setDraft({ ...DEFAULT_FILTERS })}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Resetuj
            </button>
          </div>

          {/* Age range */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Wiek</p>
              <span className="text-sm text-primary font-medium">{draft.ageMin} – {draft.ageMax} lat</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Min</span><span>{draft.ageMin}</span>
                </div>
                <input
                  type="range" min={18} max={draft.ageMax - 1} value={draft.ageMin}
                  onChange={e => setDraft(p => ({ ...p, ageMin: +e.target.value }))}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Max</span><span>{draft.ageMax}</span>
                </div>
                <input
                  type="range" min={draft.ageMin + 1} max={99} value={draft.ageMax}
                  onChange={e => setDraft(p => ({ ...p, ageMax: +e.target.value }))}
                  className="w-full accent-primary"
                />
              </div>
            </div>
          </div>

          {/* Distance */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Odległość</p>
              <span className="text-sm text-primary font-medium">do {draft.distanceMax} km</span>
            </div>
            <input
              type="range" min={1} max={200} value={draft.distanceMax}
              onChange={e => setDraft(p => ({ ...p, distanceMax: +e.target.value }))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 km</span><span>200 km</span>
            </div>
          </div>

          {/* Gender */}
          <div className="mb-6">
            <p className="text-sm font-semibold mb-3">Płeć</p>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map(g => (
                <button
                  key={g}
                  onClick={() => toggleArr('gender', g)}
                  className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-all border ${
                    draft.gender.includes(g)
                      ? 'gradient-fire text-primary-foreground border-transparent'
                      : 'glass border-border text-muted-foreground'
                  }`}
                >
                  {draft.gender.includes(g) && <Check className="w-3 h-3" />}
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="mb-6">
            <p className="text-sm font-semibold mb-3">Nastawienie</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map(m => (
                <button
                  key={m}
                  onClick={() => toggleArr('moodStatus', m)}
                  className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-all border ${
                    draft.moodStatus.includes(m)
                      ? 'gradient-fire text-primary-foreground border-transparent'
                      : 'glass border-border text-muted-foreground'
                  }`}
                >
                  {draft.moodStatus.includes(m) && <Check className="w-3 h-3" />}
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Verified only */}
          <div className="mb-8">
            <div className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Tylko zweryfikowani</p>
                <p className="text-xs text-muted-foreground">Pokaż tylko profile z niebieskim badge'em</p>
              </div>
              <button
                onClick={() => setDraft(p => ({ ...p, verifiedOnly: !p.verifiedOnly }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${draft.verifiedOnly ? 'bg-primary' : 'bg-secondary'}`}
              >
                <motion.div
                  animate={{ x: draft.verifiedOnly ? 22 : 2 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="absolute top-0.5 w-5 h-5 bg-primary-foreground rounded-full shadow"
                />
              </button>
            </div>
          </div>

          {/* Apply */}
          <button
            onClick={() => { onApply(draft); onClose(); }}
            className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red"
          >
            Zastosuj filtry {activeCount > 0 && `(${activeCount})`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

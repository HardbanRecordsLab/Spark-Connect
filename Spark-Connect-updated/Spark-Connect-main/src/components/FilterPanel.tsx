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
  onlineOnly: boolean;
  withPhotosOnly: boolean;
  heightMin?: number;
  heightMax?: number;
  bodyType: string[];
  breastSize: string[];
  pubicHair: string[];
  eyeColor: string[];
  hairColor: string[];
  smoking: string[];
  drinking: string[];
  relationshipGoal: string[];
  sexualRole: string[];
  safeSex: string[];
  likes: string[];
  dislikes: string[];
}

export const DEFAULT_FILTERS: DiscoverFilters = {
  ageMin: 18,
  ageMax: 50,
  distanceMax: 50,
  gender: [],
  orientation: [],
  moodStatus: [],
  verifiedOnly: false,
  onlineOnly: false,
  withPhotosOnly: true,
  bodyType: [],
  breastSize: [],
  pubicHair: [],
  eyeColor: [],
  hairColor: [],
  smoking: [],
  drinking: [],
  relationshipGoal: [],
  sexualRole: [],
  safeSex: [],
  likes: [],
  dislikes: [],
};

const GENDERS = ['Kobieta', 'Mężczyzna', 'Para (KM)', 'Para (KK)', 'Para (MM)', 'Trans/CD'];
const MOODS = ['Zabawa i seks 🔥', 'Randki bez zobowiązań 🌙', 'Szukam miłości 💍', 'Przyjaźń 🤝', 'Trójkąty/Poliamoria 🌈'];
const BODY_TYPES = ['Szczupła', 'Normalna', 'Atletyczna', 'Krągła', 'Muskularna', 'Puszysta', 'Kulturysta'];
const BREAST_SIZE = ['A', 'B', 'C', 'D', 'E', 'F', 'G+', 'Brak danych'];
const PUBIC_HAIR = ['Całkowicie ogolone', 'Przystrzyżone', 'Naturalne', 'Pasek'];
const EYE_COLORS = ['Niebieskie', 'Brązowe', 'Zielone', 'Szare', 'Piwne', 'Czarne'];
const HAIR_COLORS = ['Czarne', 'Blond', 'Brązowe', 'Rude', 'Siwe', 'Łysy', 'Kolorowe'];
const SMOKING = ['Nigdy', 'Okazyjnie', 'Regularnie', 'Tylko e-papierosy'];
const DRINKING = ['Nigdy', 'Okazyjnie', 'W weekendy', 'Regularnie'];

const SEXUAL_PREFERENCES = [
  'Dominujący/a 👑', 'Uległy/a ⛓️', 'Switch 🔄', 'Vanilla 🍦', 'Kinky 👅', 'Voyeur 👁️', 'Exhibitionist 🍑', 'Swinger 🍍'
];

const SAFE_SEX = ['Zawsze', 'Zależy od osoby', 'Nie używam', 'Tylko z partnerem'];

const LIKES_DISLIKES = {
  likes: ['Seks oralny', 'Seks analny', 'BDSM', 'Fetysz stóp', 'Roleplay', 'Szybki numerek', 'Długie sesje', 'Seks w miejscu publicznym', 'Zabawki', 'Lekkie wiązanie'],
  dislikes: ['Brak higieny', 'Palenie przy seksie', 'Zbyt szybkie tempo', 'Brak zabezpieczeń', 'Nuda w łóżku', 'Agresja']
};

interface FilterPanelProps {
  filters: DiscoverFilters;
  onApply: (f: DiscoverFilters) => void;
  onClose: () => void;
}

export default function FilterPanel({ filters, onApply, onClose }: FilterPanelProps) {
  const [draft, setDraft] = useState<DiscoverFilters>({ ...filters });

  const toggleArr = (key: keyof Pick<DiscoverFilters, 'gender' | 'orientation' | 'moodStatus' | 'bodyType' | 'eyeColor' | 'hairColor' | 'smoking' | 'drinking'>, val: string) => {
    setDraft(prev => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  };

  const renderTagGroup = (title: string, key: keyof DiscoverFilters, options: string[]) => (
    <div className="mb-6">
      <p className="text-sm font-semibold mb-3">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => toggleArr(key as any, opt)}
            className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-all border ${
              (draft[key] as string[]).includes(opt)
                ? 'gradient-fire text-primary-foreground border-transparent'
                : 'glass border-border text-muted-foreground'
            }`}
          >
            {(draft[key] as string[]).includes(opt) && <Check className="w-3 h-3" />}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  const activeCount = [
    draft.ageMin !== DEFAULT_FILTERS.ageMin || draft.ageMax !== DEFAULT_FILTERS.ageMax,
    draft.distanceMax !== DEFAULT_FILTERS.distanceMax,
    draft.gender.length > 0,
    draft.moodStatus.length > 0,
    draft.verifiedOnly,
    draft.onlineOnly,
    !draft.withPhotosOnly,
    draft.bodyType.length > 0,
    draft.breastSize.length > 0,
    draft.pubicHair.length > 0,
    draft.eyeColor.length > 0,
    draft.hairColor.length > 0,
    draft.smoking.length > 0,
    draft.drinking.length > 0,
    draft.relationshipGoal.length > 0,
    draft.sexualRole.length > 0,
    draft.safeSex.length > 0,
    draft.likes.length > 0,
    draft.dislikes.length > 0,
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
          {renderTagGroup('Płeć', 'gender', GENDERS)}

          {/* Mood */}
          {renderTagGroup('Nastawienie', 'moodStatus', MOODS)}

          {/* New Advanced Filters */}
          <div className="border-t border-border pt-6 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6 italic">Budowa Ciała 💎</h3>
            {renderTagGroup('Sylwetka', 'bodyType', BODY_TYPES)}
            {renderTagGroup('Biust', 'breastSize', BREAST_SIZE)}
            {renderTagGroup('Włosy łonowe', 'pubicHair', PUBIC_HAIR)}
            {renderTagGroup('Kolor oczu', 'eyeColor', EYE_COLORS)}
            {renderTagGroup('Kolor włosów', 'hairColor', HAIR_COLORS)}
          </div>

          <div className="border-t border-border pt-6 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-6 italic">Upodobania 18+ 🔥</h3>
            {renderTagGroup('Nastawienie', 'moodStatus', MOODS)}
            {renderTagGroup('Rola w łóżku', 'sexualRole', SEXUAL_PREFERENCES)}
            {renderTagGroup('Bezpieczny seks', 'safeSex', SAFE_SEX)}
            {renderTagGroup('To co uwielbia 👅', 'likes', LIKES_DISLIKES.likes)}
            {renderTagGroup('Tego nie lubi 🚫', 'dislikes', LIKES_DISLIKES.dislikes)}
          </div>

          <div className="border-t border-border pt-6 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">Styl Życia</h3>
            {renderTagGroup('Palenie', 'smoking', SMOKING)}
            {renderTagGroup('Alkohol', 'drinking', DRINKING)}
          </div>

          {/* Verified only */}
          <div className="mb-4">
            <div className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Tylko zweryfikowani</p>
                <p className="text-xs text-muted-foreground">Profile z niebieskim badge'em</p>
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

          {/* Online now */}
          <div className="mb-4">
            <div className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Teraz online</p>
                <p className="text-xs text-muted-foreground">Pokaż tylko aktywnych użytkowników</p>
              </div>
              <button
                onClick={() => setDraft(p => ({ ...p, onlineOnly: !p.onlineOnly }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${draft.onlineOnly ? 'bg-green-500' : 'bg-secondary'}`}
              >
                <motion.div
                  animate={{ x: draft.onlineOnly ? 22 : 2 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="absolute top-0.5 w-5 h-5 bg-primary-foreground rounded-full shadow"
                />
              </button>
            </div>
          </div>

          {/* With photos */}
          <div className="mb-8">
            <div className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Tylko ze zdjęciami</p>
                <p className="text-xs text-muted-foreground">Ukryj profile bez zdjęć</p>
              </div>
              <button
                onClick={() => setDraft(p => ({ ...p, withPhotosOnly: !p.withPhotosOnly }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${draft.withPhotosOnly ? 'bg-primary' : 'bg-secondary'}`}
              >
                <motion.div
                  animate={{ x: draft.withPhotosOnly ? 22 : 2 }}
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

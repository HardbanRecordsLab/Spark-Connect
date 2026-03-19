import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';

const EMOJI_CATEGORIES: { label: string; emoji: string; items: string[] }[] = [
  {
    label: 'Ostatnie',
    emoji: '🕐',
    items: ['😍', '🔥', '❤️', '😂', '🥰', '😘', '💕', '👋'],
  },
  {
    label: 'Emocje',
    emoji: '😊',
    items: [
      '😀','😂','🥹','😍','😘','🥰','😏','😎','🤩','😜',
      '😇','🥳','😱','😢','😭','😤','🤔','🥺','😬','🙃',
      '🫠','😮','🤯','🥴','😴','🤤','🫡','😌','🤭','🫣',
    ],
  },
  {
    label: 'Gesty',
    emoji: '👋',
    items: [
      '👋','🤙','👍','👎','❤️','🔥','💯','✨','🎉','🙌',
      '👏','🤝','🫶','💪','🤞','✌️','🖐️','🤘','🫰','👌',
    ],
  },
  {
    label: 'Miłość',
    emoji: '❤️',
    items: [
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💖','💗',
      '💓','💞','💝','💘','❣️','💔','❤️‍🔥','❤️‍🩹','💌','🌹',
    ],
  },
  {
    label: 'Jedzenie',
    emoji: '🍕',
    items: [
      '🍕','🍔','🍣','🍜','🍩','🎂','🍷','🍸','🧃','☕',
      '🍓','🍇','🍑','🥑','🌮','🥗','🍦','🍫','🧁','🥂',
    ],
  },
  {
    label: 'Aktywności',
    emoji: '⚽',
    items: [
      '⚽','🏀','🎮','🎵','🎸','🏖️','✈️','🏔️','🎭','📸',
      '🧘','💃','🕺','🎯','🏋️','🤸','🧗','🛹','🏄','🤿',
    ],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filteredEmojis = search
    ? EMOJI_CATEGORIES.flatMap(c => c.items).filter((_, i) =>
        // Simple fuzzy match by position for demo
        i < 40
      ).slice(0, 40)
    : EMOJI_CATEGORIES[activeTab].items;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="absolute bottom-full left-0 mb-2 w-72 glass-strong border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
    >
      {/* Search */}
      <div className="p-2 border-b border-border">
        <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
          <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj emoji..."
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border overflow-x-auto scrollbar-hidden">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              onClick={() => setActiveTab(i)}
              title={cat.label}
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                activeTab === i ? 'bg-primary/20 border border-primary/30' : 'hover:bg-secondary'
              }`}
            >
              {cat.emoji}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="p-2 max-h-48 overflow-y-auto scrollbar-hidden">
        {!search && (
          <p className="text-xs text-muted-foreground mb-2 px-1">
            {EMOJI_CATEGORIES[activeTab].label}
          </p>
        )}
        <div className="grid grid-cols-8 gap-0.5">
          {filteredEmojis.map((emoji, i) => (
            <motion.button
              key={`${emoji}-${i}`}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-lg rounded-lg hover:bg-secondary transition-colors"
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

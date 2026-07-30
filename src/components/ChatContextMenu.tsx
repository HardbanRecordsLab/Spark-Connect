import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ban, Flag, HeartOff, Archive, Trash2, VolumeX } from 'lucide-react';

interface ChatContextMenuProps {
  userName: string;
  onBlock: () => void;
  onReport: () => void;
  onUnmatch: () => void;
  onArchive: () => void;
  onMute: () => void;
  onClearChat: () => void;
  onClose: () => void;
  isArchived?: boolean;
  isMuted?: boolean;
}

export default function ChatContextMenu({
  userName, onBlock, onReport, onUnmatch,
  onArchive, onMute, onClearChat, onClose,
  isArchived = false, isMuted = false,
}: ChatContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = [
    { icon: VolumeX, label: isMuted ? `Cofnij wyciszenie ${userName}` : `Wycisz ${userName}`, action: onMute, variant: 'normal' },
    { icon: Archive, label: isArchived ? 'Przywróć z archiwum' : 'Archiwizuj rozmowę', action: onArchive, variant: 'normal' },
    { icon: Trash2, label: 'Wyczyść historię', action: onClearChat, variant: 'normal' },
    { icon: Flag, label: `Zgłoś ${userName}`, action: onReport, variant: 'warning' },
    { icon: HeartOff, label: 'Usuń dopasowanie', action: onUnmatch, variant: 'danger' },
    { icon: Ban, label: `Zablokuj ${userName}`, action: onBlock, variant: 'danger' },
  ] as const;

  const variantClasses = {
    normal: 'text-foreground hover:bg-secondary',
    warning: 'text-yellow-500 hover:bg-yellow-500/10',
    danger: 'text-destructive hover:bg-destructive/10',
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="absolute top-full right-0 mt-1 w-56 glass-strong border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
    >
      {items.map((item, i) => (
        <button
          key={item.label}
          onClick={() => { item.action(); onClose(); }}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${variantClasses[item.variant]} ${
            i > 0 && items[i - 1].variant !== item.variant ? 'border-t border-border' : ''
          }`}
        >
          <item.icon className="w-4 h-4 flex-shrink-0" />
          {item.label}
        </button>
      ))}
    </motion.div>
  );
}

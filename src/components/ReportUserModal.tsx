import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'harassment', label: 'Nękanie / groźby' },
  { value: 'underage', label: 'Podejrzenie niepełnoletności' },
  { value: 'fake_photos', label: 'Fałszywe zdjęcia' },
  { value: 'spam', label: 'Spam / reklama' },
  { value: 'bot', label: 'Bot / fałszywe konto' },
  { value: 'inappropriate', label: 'Nieodpowiednie treści' },
  { value: 'other', label: 'Inne' },
];

interface ReportUserModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onReported: () => void;
}

export default function ReportUserModal({ userId, userName, onClose, onReported }: ReportUserModalProps) {
  const [category, setCategory] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!category) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSubmitting(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { error } = await db.from('reports').insert({
      reporter_id: user.id,
      reported_id: userId,
      category,
      reason: CATEGORIES.find(c => c.value === category)?.label ?? category,
      details: details.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error('Nie udało się wysłać zgłoszenia. Spróbuj ponownie.'); return; }
    toast.success('Zgłoszenie wysłane. Dziękujemy — nasz zespół to sprawdzi.');
    onReported();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
          className="w-full bg-card rounded-t-3xl p-6 space-y-4 max-h-[80vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-lg">Zgłoś {userName}</h3>
          </div>
          <div className="space-y-2">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-medium transition-all border ${
                  category === c.value ? 'bg-primary/15 border-primary/40 text-primary' : 'glass border-border text-foreground'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="Dodatkowe informacje (opcjonalnie)..."
            rows={3}
            maxLength={500}
            className="w-full bg-secondary/60 rounded-xl px-3 py-2.5 text-sm outline-none border border-border resize-none"
          />
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 glass py-3.5 rounded-2xl font-semibold">Anuluj</button>
            <button
              onClick={handleSubmit}
              disabled={!category || submitting}
              className="flex-1 bg-destructive text-destructive-foreground py-3.5 rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Wyślij zgłoszenie'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

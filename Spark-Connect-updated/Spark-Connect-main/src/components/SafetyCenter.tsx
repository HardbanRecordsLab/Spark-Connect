import { motion } from 'framer-motion';
import { X, AlertTriangle, MapPin, UserCheck, Eye } from 'lucide-react';

interface SafetyCenterProps {
  onClose: () => void;
}

export default function SafetyCenter({ onClose }: SafetyCenterProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-end">
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full glass-strong rounded-t-3xl border border-border max-h-[85vh] overflow-y-auto scrollbar-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-lg">Centrum bezpieczeństwa</h2>
          <button onClick={onClose} className="w-8 h-8 glass rounded-full flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {/* SOS */}
          <div className="rounded-2xl p-5 text-center mb-5"
            style={{ background: 'rgba(212,96,122,.07)', border: '1px solid rgba(212,96,122,.2)' }}>
            <div className="text-5xl mb-3">🆘</div>
            <h3 className="font-bold text-lg mb-2" style={{ color: '#e87898' }}>Przycisk awaryjny</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Naciśnij i przytrzymaj 3 sekundy — wyślemy Twoją lokalizację do zaufanej osoby i służbom ratunkowym.
            </p>
            <button className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#d4607a,#e87898)', boxShadow: '0 4px 24px rgba(212,96,122,.4)' }}
              onClick={() => alert('🆘 W prawdziwej aplikacji wezwie pomoc!')}>
              🆘
            </button>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {[
              { icon: <UserCheck className="w-5 h-5" />, title: 'Kontakt awaryjny', desc: 'Dodaj osobę która wie gdzie jesteś', action: '+' },
              { icon: <MapPin className="w-5 h-5" />, title: 'Udostępnij trasę', desc: 'Wyślij plan spotkania znajomemu', action: '›' },
              { icon: <Eye className="w-5 h-5" />, title: 'Tryb ukryty', desc: 'Widoczna/y tylko dla osób które polubiłaś/eś', action: '›' },
              { icon: <AlertTriangle className="w-5 h-5" />, title: 'Zgłoś profil', desc: 'Jeśli coś wygląda podejrzanie', action: '›' },
            ].map((item, i) => (
              <button key={i} className="w-full flex items-center gap-3 p-3.5 rounded-xl glass border border-border text-left transition-all hover:border-primary/30">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-primary flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
                <span className="text-muted-foreground text-lg">{item.action}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
            <p className="text-xs text-muted-foreground leading-relaxed">
              🔒 <strong className="text-foreground">Twoja prywatność jest chroniona.</strong> Dane dotyczące bezpieczeństwa nie są udostępniane osobom trzecim bez Twojej zgody.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, X, Lock, Check, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

interface CoinPackage {
  coins: number;
  price: string;
  priceNum: number;
  popular: boolean;
  bonus?: string;
}

const PACKAGES: CoinPackage[] = [
  { coins: 100, price: '0,99 €', priceNum: 0.99, popular: false },
  { coins: 500, price: '3,99 €', priceNum: 3.99, popular: true, bonus: '+50 gratis' },
  { coins: 2000, price: '12,99 €', priceNum: 12.99, popular: false, bonus: '+200 gratis' },
];

interface PaymentModalProps {
  pkg: CoinPackage;
  onClose: () => void;
}

function PaymentModal({ pkg, onClose }: PaymentModalProps) {
  const [step, setStep] = useState<'form' | 'processing' | 'success'>('form');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const { addCoins } = useAppStore();

  const formatCard = (val: string) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  const formatExpiry = (val: string) =>
    val.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(?=\d)/, '$1/');

  const handlePay = async () => {
    setStep('processing');
    await new Promise(r => setTimeout(r, 2000));
    addCoins(pkg.coins);
    setStep('success');
  };

  const isValid = cardNumber.replace(/\s/g, '').length === 16 && expiry.length === 5 && cvv.length >= 3;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full sm:max-w-sm bg-card rounded-t-3xl sm:rounded-3xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold">Kup {pkg.coins} coinów</h3>
                <button onClick={onClose} className="w-8 h-8 glass rounded-full flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="glass rounded-2xl p-4 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🪙</span>
                  <div>
                    <p className="font-bold">{pkg.coins.toLocaleString()} coinów</p>
                    {pkg.bonus && <p className="text-xs text-primary">{pkg.bonus}</p>}
                  </div>
                </div>
                <span className="text-xl font-black gradient-text">{pkg.price}</span>
              </div>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Numer karty</label>
                  <div className="glass flex items-center gap-2 rounded-xl px-3 py-3 border border-border focus-within:border-primary/50 transition-colors">
                    <CreditCard className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <input
                      value={cardNumber}
                      onChange={e => setCardNumber(formatCard(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      className="flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Ważność</label>
                    <input
                      value={expiry}
                      onChange={e => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/RR"
                      className="w-full glass rounded-xl px-3 py-3 text-sm outline-none border border-border focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">CVV</label>
                    <input
                      value={cvv}
                      onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="•••"
                      type="password"
                      className="w-full glass rounded-xl px-3 py-3 text-sm outline-none border border-border focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handlePay}
                disabled={!isValid}
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                  isValid ? 'gradient-fire text-primary-foreground glow-red' : 'bg-secondary text-muted-foreground cursor-not-allowed'
                }`}
              >
                <Lock className="w-4 h-4" />
                Zapłać {pkg.price}
              </button>
              <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                Płatność szyfrowana SSL • Test: dowolne dane
              </p>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 gap-4">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Loader2 className="w-10 h-10 text-primary" />
              </motion.div>
              <p className="font-semibold">Przetwarzanie płatności...</p>
              <p className="text-sm text-muted-foreground">To może potrwać chwilę</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8 gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="w-20 h-20 gradient-fire rounded-full flex items-center justify-center"
              >
                <Check className="w-10 h-10 text-primary-foreground" />
              </motion.div>
              <h3 className="text-xl font-bold">Płatność udana! 🎉</h3>
              <p className="text-muted-foreground text-center">
                Dodano <span className="font-bold text-accent">{pkg.coins} coinów</span> do Twojego konta
              </p>
              <button onClick={onClose} className="gradient-fire text-primary-foreground px-8 py-3 rounded-2xl font-bold mt-2">
                Super! 🪙
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

interface CoinPackagesProps {
  packages?: CoinPackage[];
}

export default function CoinPackages({ packages = PACKAGES }: CoinPackagesProps) {
  const [selected, setSelected] = useState<CoinPackage | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {packages.map(pkg => (
          <motion.button
            key={pkg.coins}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelected(pkg)}
            className={`relative glass rounded-2xl p-4 text-center flex flex-col items-center gap-2 ${
              pkg.popular ? 'neon-border' : 'border border-border'
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 gradient-fire text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                🔥 Najlepszy
              </span>
            )}
            <span className="text-2xl font-black text-accent">{pkg.coins}</span>
            <span className="text-xs text-muted-foreground">coinów</span>
            {pkg.bonus && <span className="text-xs text-primary font-medium">{pkg.bonus}</span>}
            <span className="text-sm font-bold">{pkg.price}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected && <PaymentModal pkg={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </>
  );
}

export { PACKAGES };
export type { CoinPackage };

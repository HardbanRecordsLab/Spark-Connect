import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'spark-connect-age-verified';

export default function AgeGate() {
  const [verified, setVerified] = useState(true);

  useEffect(() => {
    setVerified(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  const confirm = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVerified(true);
  };

  const decline = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <AnimatePresence>
      {!verified && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] bg-black flex items-center justify-center px-6"
        >
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="text-5xl">🔞</div>
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">Treści dla dorosłych</h1>
            <p className="text-sm text-white/60 leading-relaxed">
              Ten portal zawiera treści przeznaczone wyłącznie dla osób, które ukończyły 18 lat. Potwierdzając, oświadczasz, że masz ukończone 18 lat.
            </p>
            <div className="space-y-3">
              <button
                onClick={confirm}
                className="w-full gradient-fire text-white font-black py-4 rounded-2xl text-sm uppercase tracking-widest shadow-xl"
              >
                Mam ukończone 18 lat
              </button>
              <button
                onClick={decline}
                className="w-full glass py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] border border-white/10 text-white/50"
              >
                Nie mam 18 lat, wyjdź
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

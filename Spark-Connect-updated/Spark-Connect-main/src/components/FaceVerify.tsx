import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, Shield, X, RotateCcw } from 'lucide-react';

interface FaceVerifyProps {
  onVerified: () => void;
  onClose: () => void;
}

type Step = 'intro' | 'camera' | 'recording' | 'processing' | 'success' | 'failed';

export default function FaceVerify({ onVerified, onClose }: FaceVerifyProps) {
  const [step, setStep] = useState<Step>('intro');
  const [countdown, setCountdown] = useState(3);
  const [recordProgress, setRecordProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step === 'camera') {
      setCountdown(3);
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timerRef.current!);
            setStep('recording');
            return 3;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  useEffect(() => {
    if (step === 'recording') {
      setRecordProgress(0);
      timerRef.current = setInterval(() => {
        setRecordProgress(p => {
          if (p >= 100) {
            clearInterval(timerRef.current!);
            setStep('processing');
            return 100;
          }
          return p + 3.33;
        });
      }, 100);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step]);

  useEffect(() => {
    if (step === 'processing') {
      const t = setTimeout(() => setStep('success'), 2500);
      return () => clearTimeout(t);
    }
  }, [step]);

  const instructions = [
    { icon: '📸', text: 'Face your front camera clearly' },
    { icon: '💡', text: 'Ensure good lighting' },
    { icon: '🔄', text: 'Slowly turn your head left & right' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-bold">Face Verify</span>
        </div>
        <button onClick={onClose} className="w-9 h-9 glass rounded-full flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-5 pb-8">
        <AnimatePresence mode="wait">

          {/* ── Intro ── */}
          {step === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 text-center"
            >
              <div className="w-28 h-28 gradient-fire rounded-full flex items-center justify-center text-5xl glow-red">
                🛡️
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Get Verified 🔵</h2>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                  A quick 3-second face scan to prove you're real. No data stored — processed entirely in your browser.
                </p>
              </div>

              <div className="w-full space-y-3">
                {instructions.map(inst => (
                  <div key={inst.text} className="glass rounded-2xl px-4 py-3 flex items-center gap-3 text-left">
                    <span className="text-2xl">{inst.icon}</span>
                    <span className="text-sm">{inst.text}</span>
                  </div>
                ))}
              </div>

              <div className="glass rounded-2xl p-3 border border-primary/20 text-center w-full">
                <p className="text-xs text-muted-foreground">🔒 Zero data leaves your device. 100% private.</p>
              </div>

              <div className="w-full space-y-3">
                <button
                  onClick={() => setStep('camera')}
                  className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Start Verification
                </button>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-accent font-bold">+50 🪙</span>
                  <span className="text-sm text-muted-foreground">coins reward upon verification</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Camera + Countdown ── */}
          {step === 'camera' && (
            <motion.div key="camera" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6"
            >
              <div className="relative w-64 h-64">
                {/* Camera frame */}
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-primary/50 bg-secondary flex items-center justify-center">
                  <Camera className="w-16 h-16 text-muted-foreground" />
                </div>
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-primary" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-primary" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-primary" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-primary" />
                {/* Countdown */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.span
                    key={countdown}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl font-black gradient-text"
                  >
                    {countdown}
                  </motion.span>
                </div>
              </div>
              <p className="text-center text-muted-foreground text-sm">Position your face in the circle</p>
            </motion.div>
          )}

          {/* ── Recording ── */}
          {step === 'recording' && (
            <motion.div key="recording" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6"
            >
              <div className="relative w-64 h-64">
                <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                  <Camera className="w-16 h-16 text-muted-foreground" />
                </div>
                {/* Recording ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 256 256">
                  <circle cx="128" cy="128" r="120" fill="none" stroke="hsl(var(--primary) / 0.2)" strokeWidth="8" />
                  <circle
                    cx="128" cy="128" r="120" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (1 - recordProgress / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                  />
                </svg>
                {/* REC dot */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 glass px-3 py-1 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  <span className="text-xs font-bold">REC</span>
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold mb-1">Slowly turn your head</p>
                <p className="text-sm text-muted-foreground">Left → Center → Right</p>
              </div>
              <div className="flex gap-3 text-3xl">
                {['←', '😐', '→'].map((s, i) => (
                  <motion.span key={i}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, delay: i * 0.5, duration: 1.5 }}
                  >{s}</motion.span>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Processing ── */}
          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 text-center"
            >
              <div className="relative w-28 h-28">
                <motion.div
                  className="w-full h-full rounded-full border-4 border-primary/30"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border-4 border-primary border-t-transparent"
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🔍</div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Analyzing...</h3>
                <p className="text-sm text-muted-foreground">Running face detection in your browser</p>
              </div>
              <div className="w-full space-y-2">
                {['Detecting face landmarks...', 'Comparing with profile photo...', 'Calculating liveness score...'].map((text, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.6 }}
                    className="flex items-center gap-3 glass rounded-xl px-4 py-2.5"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.3 }}
                      className="w-2 h-2 rounded-full bg-primary"
                    />
                    <span className="text-sm text-muted-foreground">{text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Success ── */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', bounce: 0.6 }}
                className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center"
              >
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="w-12 h-12 text-primary" />
                </div>
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold mb-2">Verified! 🔵</h2>
                <p className="text-muted-foreground text-sm">Your profile now shows the verified badge, building trust with other users.</p>
              </div>

              <div className="w-full glass rounded-2xl p-4 border border-accent/30 text-center">
                <p className="text-3xl font-black text-accent mb-1">+50 🪙</p>
                <p className="text-sm text-muted-foreground">Coins added to your balance!</p>
              </div>

              <div className="flex items-center gap-2 glass px-4 py-2 rounded-full border border-primary/30">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Verified badge now on your profile</span>
              </div>

              <button
                onClick={onVerified}
                className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red"
              >
                Awesome! 🔥
              </button>
            </motion.div>
          )}

          {/* ── Failed ── */}
          {step === 'failed' && (
            <motion.div key="failed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 text-center"
            >
              <div className="text-6xl">😕</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Couldn't verify</h3>
                <p className="text-sm text-muted-foreground">Make sure your face is well lit and fully visible in frame.</p>
              </div>
              <button
                onClick={() => setStep('intro')}
                className="w-full glass border border-border rounded-2xl py-4 font-semibold flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}

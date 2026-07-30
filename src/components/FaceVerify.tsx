import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, Shield, X, RotateCcw, AlertCircle } from 'lucide-react';
import { useR2Upload } from '@/hooks/useR2Upload';
import { supabase } from '@/integrations/supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface FaceVerifyProps {
  userId: string | null | undefined;
  onVerified: () => void;
  onClose: () => void;
}

type Step = 'intro' | 'camera' | 'uploading' | 'submitted' | 'failed';

export default function FaceVerify({ userId, onVerified, onClose }: FaceVerifyProps) {
  const [step, setStep] = useState<Step>('intro');
  const [countdown, setCountdown] = useState(3);
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { upload } = useR2Upload();

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStep('camera');
    } catch {
      setErrorMsg('Brak dostępu do kamery. Zezwól na dostęp w przeglądarce i spróbuj ponownie.');
      setStep('failed');
    }
  };

  useEffect(() => {
    if (step !== 'camera') return;
    setCountdown(3);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          capture();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const capture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !userId) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    stopCamera();
    setStep('uploading');

    canvas.toBlob(async (blob) => {
      if (!blob) { setErrorMsg('Nie udało się zrobić zdjęcia.'); setStep('failed'); return; }
      try {
        const { key } = await upload({ bucket: 'private', file: blob, filename: 'verify.jpg' });
        const { error } = await db.from('verification_requests').insert({ user_id: userId, photo_key: key });
        if (error) throw error;
        setStep('submitted');
      } catch (err) {
        console.error('Verification submit failed:', err);
        setErrorMsg('Nie udało się wysłać zdjęcia. Spróbuj ponownie.');
        setStep('failed');
      }
    }, 'image/jpeg', 0.9);
  };

  const instructions = [
    { icon: '📸', text: 'Ustaw twarz przed kamerą' },
    { icon: '💡', text: 'Zadbaj o dobre oświetlenie' },
    { icon: '🆔', text: 'Zdjęcie trafi do ręcznej weryfikacji przez administratora' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
    >
      <div className="flex items-center justify-between px-5 pt-safe pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-bold">Weryfikacja profilu</span>
        </div>
        <button onClick={() => { stopCamera(); onClose(); }} className="w-9 h-9 glass rounded-full flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-5 pb-8">
        <AnimatePresence mode="wait">

          {step === 'intro' && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 text-center"
            >
              <div className="w-28 h-28 gradient-fire rounded-full flex items-center justify-center text-5xl glow-red">
                🛡️
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Zweryfikuj profil 🔵</h2>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                  Zrób jedno zdjęcie z kamery — trafi do administratora, który ręcznie potwierdzi, że to naprawdę Ty.
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

              <button
                onClick={startCamera}
                className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Włącz kamerę i zrób zdjęcie
              </button>
            </motion.div>
          )}

          {step === 'camera' && (
            <motion.div key="camera" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6"
            >
              <div className="relative w-64 h-64">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-primary/50 bg-secondary">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                </div>
                <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-primary" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-primary" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-primary" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-primary" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.span
                    key={countdown}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl font-black gradient-text drop-shadow-lg"
                  >
                    {countdown || '📸'}
                  </motion.span>
                </div>
              </div>
              <p className="text-center text-muted-foreground text-sm">Ustaw twarz w okręgu — zdjęcie za chwilę</p>
              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          )}

          {step === 'uploading' && (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 text-center"
            >
              <motion.div
                className="w-20 h-20 rounded-full border-4 border-primary border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              />
              <p className="font-semibold">Wysyłanie zdjęcia…</p>
            </motion.div>
          )}

          {step === 'submitted' && (
            <motion.div key="submitted" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
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
                <h2 className="text-2xl font-bold mb-2">Wysłano do weryfikacji 📨</h2>
                <p className="text-muted-foreground text-sm">
                  Administrator sprawdzi zdjęcie zwykle w ciągu 24 godzin. Odznaka „Zweryfikowany" pojawi się na Twoim profilu automatycznie po zatwierdzeniu.
                </p>
              </div>

              <button
                onClick={onVerified}
                className="w-full gradient-fire text-primary-foreground font-bold py-4 rounded-2xl glow-red"
              >
                Rozumiem 🔥
              </button>
            </motion.div>
          )}

          {step === 'failed' && (
            <motion.div key="failed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 text-center"
            >
              <AlertCircle className="w-14 h-14 text-destructive" />
              <div>
                <h3 className="text-xl font-bold mb-2">Coś poszło nie tak</h3>
                <p className="text-sm text-muted-foreground">{errorMsg || 'Spróbuj ponownie.'}</p>
              </div>
              <button
                onClick={() => setStep('intro')}
                className="w-full glass border border-border rounded-2xl py-4 font-semibold flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Spróbuj ponownie
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { ChevronLeft, FileText, Scale, Database, UserCheck, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSeo } from '@/hooks/useSeo';

const GDPR = () => {
  const navigate = useNavigate();

  useSeo({
    title: 'RODO / GDPR – Obowiązek Informacyjny',
    description: 'Informacje o przetwarzaniu danych osobowych w Spark Connect zgodnie z RODO/GDPR: administrator danych, cele przetwarzania, Twoje prawa.',
    path: '/gdpr',
  });

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="w-10 h-10 glass rounded-full flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">RODO / GDPR</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong p-8 md:p-12 rounded-[2.5rem] border border-blue-500/20 shadow-2xl space-y-8 text-white/80 leading-relaxed text-justify"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <Scale className="text-blue-400 w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em]">Twoje Prawa w Unii Europejskiej</p>
              <h2 className="text-2xl font-black uppercase">Obowiązek Informacyjny RODO</h2>
            </div>
          </div>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic text-blue-400">1. Dlaczego Spark Connect dba o RODO?</h3>
            <p>
              Zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO), Studio HRL Adult, jako część grupy HardbanRecords Lab, wdraża najwyższe standardy ochrony danych osobowych. Rozumiemy, że korzystanie z portalu randkowego wiąże się z udostępnianiem informacji o charakterze prywatnym, a często również wrażliwym. Naszym celem jest zapewnienie Ci pełnej kontroli nad tym, co dzieje się z Twoimi danymi od momentu rejestracji do ewentualnego usunięcia profilu.
            </p>
            <p>
              Działamy w oparciu o zasadę minimalizacji danych – zbieramy tylko te informacje, które są absolutnie niezbędne do świadczenia usług randkowych na najwyższym poziomie. Nie wykorzystujemy Twoich danych do profilowania kredytowego ani nie udostępniamy ich zewnętrznym agencjom marketingowym bez Twojej wyraźnej, oddzielnej zgody.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic text-blue-400">2. Twoje Prawa jako Właściciela Danych</h3>
            <p>
              RODO przyznaje Ci szereg praw, które na portalu Spark Connect możesz realizować w sposób uproszczony i zautomatyzowany:
              <ul className="list-disc ml-6 space-y-2 mt-2 text-sm">
                <li><strong>Prawo do dostępu:</strong> W każdej chwili możesz poprosić o kopię wszystkich danych, jakie o Tobie przechowujemy.</li>
                <li><strong>Prawo do sprostowania:</strong> Masz pełną możliwość edycji swoich danych profilowych bezpośrednio w ustawieniach.</li>
                <li><strong>Prawo do usunięcia danych ("Prawo do bycia zapomnianym"):</strong> Jedno kliknięcie w panelu ustawień trwale i nieodwracalnie usuwa Twój profil oraz wszystkie powiązane z nim media z naszych serwerów.</li>
                <li><strong>Prawo do przenoszenia danych:</strong> Możesz zażądać eksportu swoich danych w formacie czytelnym dla maszyn (JSON/CSV).</li>
                <li><strong>Prawo do ograniczenia przetwarzania:</strong> Możesz wycofać zgody na konkretne cele przetwarzania (np. marketing) bez wpływu na możliwość korzystania z podstawowych funkcji serwisu.</li>
              </ul>
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic text-blue-400">3. Przechowywanie i Transfer Danych</h3>
            <p>
              Twoje dane są przechowywane na bezpiecznych serwerach znajdujących się na terenie Europejskiego Obszaru Gospodarczego (EOG). Współpracujemy tylko z dostawcami infrastruktury (takimi jak Supabase i AWS), którzy gwarantują zgodność z RODO i posiadają odpowiednie certyfikaty bezpieczeństwa (ISO 27001). 
            </p>
            <p>
              W przypadku, gdy jakiekolwiek usługi pomocnicze wymagałyby transferu danych poza EOG, stosujemy rygorystyczne standardowe klauzule umowne zatwierdzone przez Komisję Europejską, aby zapewnić poziom ochrony danych tożsamy z tym obowiązującym w Unii Europejskiej. Szyfrowanie danych w spoczynku i w transmisji jest u nas standardem, a nie opcją.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic text-blue-400">4. Kontakt z Inspektorem Ochrony Danych</h3>
            <p>
              Wyznaczyliśmy dedykowanego Inspektora Ochrony Danych (IOD), który jest dostępny dla wszystkich użytkowników Spark Connect w sprawach związanych z prywatnością. Jeśli masz pytania dotyczące tego, jak przetwarzamy Twoje dane, lub chcesz zgłosić naruszenie prywatności, możesz napisać bezpośrednio na adres: <strong>spark-connect@hardbanrecordslab.online</strong> z dopiskiem "RODO/GDPR".
            </p>
            <p>
              Odpowiadamy na wszystkie wnioski dotyczące danych osobowych bez zbędnej zwłoki, nie później niż w ciągu 30 dni od otrzymania zgłoszenia. W sytuacjach skomplikowanych termin ten może zostać wydłużony, o czym zostaniesz poinformowany zgodnie z wymogami prawnymi.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-y border-white/5">
            {[
              { label: 'Pełna Transparentność', icon: <FileText className="text-blue-500" /> },
              { label: 'Szyfrowane Serwery EOG', icon: <Database className="text-indigo-500" /> },
              { label: 'Kontrola Użytkownika', icon: <UserCheck className="text-cyan-500" /> },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-xl glass flex items-center justify-center border border-white/5">{item.icon}</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl flex gap-4">
            <Lock className="text-blue-400 w-8 h-8 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-bold text-blue-400 text-sm uppercase">Twoja Prywatność to Prawo, nie Przywilej</p>
              <p className="text-xs text-white/60">Spark Connect wykorzystuje technologię "Privacy by Design", co oznacza, że ochrona danych jest wkomponowana w każdą funkcję portalu już na etapie jej projektowania.</p>
            </div>
          </div>

          <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-white/40 italic">
              Zgodność potwierdzona przez: <br />
              Dział Prawny HardbanRecords Lab
            </p>
            <button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95">
              Akceptuję Zasady RODO
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default GDPR;

import { motion } from 'framer-motion';
import { ChevronLeft, Crown, Zap, Users, Gift, PlayCircle, CheckCircle2, Sparkles, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSeo } from '@/hooks/useSeo';

const PremiumInfo = () => {
  const navigate = useNavigate();

  useSeo({
    title: 'Spark Premium – Zero opłat, zawsze',
    description: 'Wszystkie funkcje Spark Connect są darmowe. Sprawdź, co oferuje Spark Premium i dlaczego nigdy nie wprowadzimy paywalla.',
    path: '/premium-info',
  });

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="w-10 h-10 glass rounded-full flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">Spark Premium</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong p-8 md:p-12 rounded-[2.5rem] border border-amber-500/20 shadow-2xl space-y-8 text-white/80 leading-relaxed"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Crown className="text-amber-500 w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em]">Nasz model</p>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Zero opłat. Zawsze.</h2>
            </div>
          </div>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic text-amber-500">1. Wszystko, czego potrzebujesz, jest darmowe</h3>
            <p>
              Spark Connect nie ma płatnej subskrypcji i nigdy nie zablokujemy podstawowych funkcji za paywallem. Odkrywanie profili, dopasowania, czat, Feed, Stories, Mapa i Vibe Rooms — to wszystko dostępne dla każdego, od pierwszego dnia, bez limitu polubień i bez ukrytych barier.
            </p>
            <p>
              Zamiast prosić Cię o kartę płatniczą, utrzymujemy się z reklam wyświetlanych w aplikacji. Dzięki temu portal zostaje darmowy dla wszystkich, a Ty decydujesz, ile chcesz zaangażować się dodatkowo.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic text-amber-500">2. Spark Coins — zdobywasz je, nie kupujesz</h3>
            <p>
              Spark Coins to wewnętrzna waluta na prezenty w Vibe Rooms i drobne usprawnienia profilu. Zamiast płacić za nie realnymi pieniędzmi, zdobywasz je oglądając krótkie reklamy — każde obejrzenie to realne coiny na Twoim koncie, naliczane od razu.
            </p>
            <p>
              Dzienny limit doładowań chroni zarówno Ciebie, jak i stabilność systemu — to nie jest nieskończone źródło, ale uczciwy sposób na zdobycie waluty bez wyciągania portfela.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic text-amber-500">3. Status Ambasadora — nagroda za polecanie, nie za płacenie</h3>
            <p>
              Zaproszenie znajomych do Spark Connect to najlepszy sposób, by ożywić swoją okolicę — i planujemy to nagradzać czymś trwalszym niż coiny: rangami widocznymi w aplikacji, priorytetem w Discover i na Mapie oraz dostępem do zamkniętych Vibe Rooms dla najaktywniejszych ambasadorów.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold">
              <Clock className="w-3.5 h-3.5" /> Rangi Ambasadora — już w budowie, wkrótce dostępne
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4 py-8 border-y border-white/5">
            {[
              { title: 'Zero paywalla', icon: <Sparkles className="text-primary" /> },
              { title: 'Coiny za reklamy', icon: <PlayCircle className="text-amber-500" /> },
              { title: 'Prezenty w Vibe Rooms', icon: <Gift className="text-blue-500" /> },
              { title: 'Status za polecenia', icon: <Users className="text-purple-500" /> },
            ].map((item, i) => (
              <div key={i} className="glass p-4 rounded-3xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">{item.icon}</div>
                <span className="text-xs font-black uppercase tracking-widest">{item.title}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-white/40">To wszystko naprawdę działa tak:</h4>
            <div className="space-y-3">
              {[
                'Żadna kluczowa funkcja nie jest zablokowana za płatnością',
                'Coiny naliczane od razu po obejrzeniu reklamy, z dziennym limitem',
                'Zaproszenia śledzone realnie — widzisz dokładną liczbę osób, które dołączyły z Twojego linku',
                'Reklamy da się wyłączyć tylko po wyrażeniu zgody w banerze cookies — bez zgody nie ma śledzenia',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500">
              <Zap className="w-3 h-3" /> Studio HRL Adult
            </div>
            <button onClick={() => navigate('/')} className="gradient-fire px-10 py-4 rounded-full font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(255,26,78,0.3)] transition-all hover:scale-105 active:scale-95">
              Wróć do Spark
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PremiumInfo;

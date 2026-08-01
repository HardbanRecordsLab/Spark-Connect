import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, Lock, EyeOff, UserCheck, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Safety = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="w-10 h-10 glass rounded-full flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">Bezpieczeństwo</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8 text-white/80 leading-relaxed text-justify"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <ShieldCheck className="text-green-400 w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-green-400 uppercase tracking-[0.3em]">Twoja Tarcza w Sieci</p>
              <h2 className="text-2xl font-black uppercase">Centrum Bezpieczeństwa Spark</h2>
            </div>
          </div>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic text-green-400">1. Fundamenty Bezpieczeństwa Spark Connect</h3>
            <p>
              W Studio HRL Adult bezpieczeństwo nie jest tylko pustym hasłem marketingowym – to fundament, na którym zbudowaliśmy Spark Connect. Jako część HardbanRecords Lab, dysponujemy zasobami i wiedzą techniczną, która pozwala nam chronić Twoją prywatność na poziomie niespotykanym w tradycyjnych portalach randkowych. Rozumiemy, że w segmencie Adult poczucie anonimowości i bezpieczeństwa przesyłanych treści jest kluczowe, dlatego wdrożyliśmy wielowarstwowy system ochrony "Iron Shield".
            </p>
            <p>
              Nasze podejście opiera się na trzech filarach: technologii szyfrowania, rygorystycznej weryfikacji tożsamości oraz aktywnej moderacji społecznościowej. Każdy element systemu został zaprojektowany tak, abyś mógł skupić się na nawiązywaniu relacji, nie martwiąc się o wyciek danych czy kontakt z niebezpiecznymi osobami.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic text-green-400">2. Weryfikacja Biometryczna i "No-Bots Policy"</h3>
            <p>
              Największym zagrożeniem dla użytkowników portali randkowych są fałszywe profile i boty (scamy). Spark Connect wypowiedział im wojnę. Nasz autorski system weryfikacji biometrycznej analizuje zdjęcia profilowe i porównuje je z weryfikacyjnym zdjęciem typu "selfie", które użytkownik musi wykonać w czasie rzeczywistym. To eliminuje możliwość używania kradzionych zdjęć z internetu czy generowania profili przez AI.
            </p>
            <p>
              Profil oznaczony niebieską tarczą (Verified) to gwarancja, że osoba, z którą rozmawiasz, wygląda tak samo jak na zdjęciach i przeszła naszą kontrolę. Dodatkowo, nasze algorytmy behawioralne stale monitorują aktywność w portalu, wykrywając wzorce zachowań typowe dla skryptów reklamowych i spamu, eliminując je w milisekundach od momentu pojawienia się w sieci.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic text-green-400">3. Szyfrowanie Komunikacji i Ochrona Mediów</h3>
            <p>
              Wszelka komunikacja wideo w pokojach "Vibe Rooms" oraz rozmowy prywatne są przesyłane przy użyciu protokołów SSL/TLS najwyższej klasy. Oznacza to, że nikt – włącznie z pracownikami HardbanRecords Lab – nie ma wglądu w Twoje intymne rozmowy w czasie rzeczywistym. Twoje zdjęcia profilowe i prywatne są przechowywane na bezpiecznych, izolowanych serwerach z ograniczonym dostępem fizycznym i cyfrowym.
            </p>
            <p>
              Oferujemy również opcjonalne ostrzeżenie przed zrzutami ekranu w rozmowach — pamiętaj jednak, że żadna technologia webowa nie jest w stanie technicznie zablokować zrzutu ekranu ani nagrywania innym urządzeniem, więc zawsze zachowaj rozwagę w tym, czym się dzielisz.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic text-green-400">4. Kultura Szacunku i Szybkie Zgłoszenia</h3>
            <p>
              Bezpieczeństwo to także komfort psychiczny. Spark Connect posiada system błyskawicznego zgłaszania naruszeń (Report & Block). Każde zgłoszenie dotyczące nękania, nienawiści czy niechcianych treści jest analizowane przez nasz zespół moderacji najszybciej, jak to możliwe. Stosujemy zasadę "Zero Tolerancji" dla agresji i zachowań toksycznych.
            </p>
            <p>
              Wierzymy, że społeczność oparta na szacunku to społeczność bezpieczna. Dlatego nagradzamy użytkowników, którzy dbają o dobrą atmosferę i pomagają nam eliminować osoby naruszające regulamin. Pamiętaj: Ty decydujesz, kto może do Ciebie pisać i kto ma dostęp do Twoich informacji. Funkcja "Ghost Mode" (tryb niewidoczny) pozwala Ci na przeglądanie portalu bez zostawiania śladów, co daje dodatkową warstwę prywatności.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-y border-white/5">
            {[
              { label: 'Szyfrowanie 256-bit', icon: <Lock className="text-blue-500" /> },
              { label: 'Ochrona przed AI', icon: <EyeOff className="text-rose-500" /> },
              { label: 'Weryfikacja Selfie', icon: <UserCheck className="text-green-500" /> },
            ].map((item, i) => (
              <div key={i} className="glass p-4 rounded-2xl flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">{item.icon}</div>
                <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex gap-4">
            <ShieldAlert className="text-amber-500 w-8 h-8 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-bold text-amber-500 text-sm uppercase">Pamiętaj o zasadach ostrożności!</p>
              <p className="text-xs text-white/60">Nigdy nie podawaj swoich haseł, danych do kont bankowych ani adresu zamieszkania osobom, których nie znasz. Nasz zespół nigdy nie poprosi Cię o podanie hasła w wiadomości prywatnej.</p>
            </div>
          </div>

          <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-white/40 italic">
              Twoje bezpieczeństwo jest naszą misją. <br />
              Zespół Security HardbanRecords Lab
            </p>
            <button onClick={() => navigate('/')} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-xl transition-all">
              Rozumiem i Czuję się Bezpiecznie
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Safety;

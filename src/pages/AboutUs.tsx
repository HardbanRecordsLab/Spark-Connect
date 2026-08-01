import { motion } from 'framer-motion';
import { ChevronLeft, Users, Star, Target, Heart, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="w-10 h-10 glass rounded-full flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">O nas</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8 text-white/80 leading-relaxed text-justify"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl gradient-fire flex items-center justify-center">
              <Users className="text-white w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Poznaj naszą historię</p>
              <h2 className="text-2xl font-black uppercase">Studio HRL Adult & Spark Connect</h2>
            </div>
          </div>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic">Nasze Korzenie i Misja</h3>
            <p>
              Spark Connect to nie jest kolejny, generyczny portal randkowy, jakich tysiące można znaleźć w sieci. To ambitny projekt zrodzony z pasji do technologii i zrozumienia ludzkich potrzeb, realizowany przez Studio HRL Adult – wyspecjalizowaną dywizję grupy kapitałowej HardbanRecords Lab. Nasza historia zaczęła się od prostej obserwacji: rynek nowoczesnych randek stał się miejscem przesyconym sztucznością, botami i powierzchownymi relacjami. Postanowiliśmy to zmienić.
            </p>
            <p>
              Misją Studio HRL Adult jest dostarczanie najwyższej jakości platform komunikacyjnych dla dorosłych, które stawiają na autentyczność, bezpieczeństwo i luksusowe doświadczenie użytkownika. Spark Connect stanowi flagowy produkt naszej grupy, będący odpowiedzią na rosnące zapotrzebowanie na bezpieczną przestrzeń, w której realni ludzie mogą nawiązywać realne relacje – bez obaw o bycie oszukanym przez automatyczne algorytmy czy fałszywe profile.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic">Filozofia "No Bots Policy"</h3>
            <p>
              W HardbanRecords Lab wierzymy, że fundamentem każdej trwałej relacji – czy to przelotnej, czy na całe życie – jest zaufanie. Dlatego jako jedni z nielicznych na rynku wdrożyliśmy rygorystyczną politykę "No Bots". Oznacza to, że każdy profil, który widzisz na Spark Connect, przeszedł przez nasz system weryfikacji lub został zaproszony przez innego, zaufanego użytkownika. Nie używamy sztucznego "pompowania" statystyk, aby sprawić wrażenie, że portalu używają miliony. Wolimy mniejszą, ale w 100% autentyczną społeczność, niż miliony martwych dusz generowanych przez skrypty.
            </p>
            <p>
              To podejście wymaga od nas większego wysiłku i inwestycji w systemy weryfikacji tożsamości, ale jesteśmy przekonani, że w dłuższej perspektywie to jedyna droga do zbudowania marki premium, którą użytkownicy będą szanować i polecać innym. Nasz Program Ambasadorski jest sercem tego wzrostu – ufamy naszym użytkownikom i pozwalamy im współtworzyć tę przestrzeń razem z nami.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic">Innowacja i Technologia</h3>
            <p>
              Za fasadą eleganckiego interfejsu Spark Connect kryje się zaawansowana technologia opracowana przez inżynierów z HardbanRecords Lab. Wykorzystujemy nowoczesne metody szyfrowania danych, aby zapewnić pełną prywatność rozmów wideo i czatów. Nasze algorytmy dopasowania (Chemistry Score) nie opierają się tylko na lokalizacji, ale analizują realne preferencje i zachowania, aby łączyć ludzi o podobnym temperamencie i oczekiwaniach.
            </p>
            <p>
              Studio HRL Adult nieustannie inwestuje w rozwój nowych funkcji, takich jak Vibe Rooms (interaktywne pokoje tematyczne) czy Speed Dating, które mają na celu przełamanie lodów i uczynienie procesu poznawania kogoś nowym ekscytującą przygodą, a nie nudnym przesuwaniem kart.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic">Zespół i Odpowiedzialność</h3>
            <p>
              Nasz zespół składa się z ekspertów z dziedziny psychologii relacji, bezpieczeństwa sieciowego oraz pasjonatów designu. Każdy z nas wierzy w to, że technologia powinna zbliżać ludzi, a nie tworzyć między nimi bariery. Jako część HardbanRecords Lab, bierzemy pełną odpowiedzialność za jakość naszych usług i dbamy o to, aby Spark Connect był miejscem wolnym od toksyczności, spamu i nienawiści.
            </p>
            <p>
              Zachęcamy naszych użytkowników do aktywnego kontaktu i zgłaszania wszelkich sugestii. Spark Connect jest tworzony dla Was i dzięki Wam. Budujemy tę platformę od podstaw, krok po kroku, z myślą o tym, by pomagała każdemu odnaleźć jego własną "iskrę".
            </p>
          </section>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-white/5">
            {[
              { label: 'Realni Ludzie', icon: <Heart className="text-primary" /> },
              { label: 'Technologia 4K', icon: <Star className="text-amber-500" /> },
              { label: 'Bezpieczeństwo', icon: <Shield className="text-green-500" /> },
              { label: 'Misja HRL', icon: <Target className="text-blue-500" /> },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 text-center">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">{item.icon}</div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-white/40 italic">
              Z poważaniem, <br />
              Zespół Studio HRL Adult / HardbanRecords Lab
            </p>
            <button onClick={() => navigate('/')} className="gradient-fire px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-xl">
              Wróć do Spark
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AboutUs;

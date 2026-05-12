import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Crown, Zap, Star, Gem, CheckCircle2, Sparkles, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PremiumInfo = () => {
  const navigate = useNavigate();

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
          className="glass-strong p-8 md:p-12 rounded-[2.5rem] border border-amber-500/20 shadow-2xl space-y-8 text-white/80 leading-relaxed text-justify"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Crown className="text-amber-500 w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em]">Twoje Nowe Możliwości</p>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Spark Elite Premium</h2>
            </div>
          </div>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic text-amber-500">1. Przejmij Kontrolę nad Swoim Przeznaczeniem</h3>
            <p>
              W Spark Connect wierzymy, że każdy zasługuje na wyjątkowe relacje, ale to od Ciebie zależy, jak szybko je odnajdziesz. Status Spark Premium to nie jest tylko pakiet dodatkowych funkcji – to Twoja przepustka do świata priorytetowych relacji i bezgranicznych możliwości, jakie oferuje portal Studio HRL Adult. W świecie, gdzie czas jest najcenniejszą walutą, Premium pozwala Ci go oszczędzać, dostarczając to, czego szukasz, prosto pod Twoje palce.
            </p>
            <p>
              Przejście na poziom Elite Premium oznacza, że przestajesz być anonimowym użytkownikiem w tłumie. Twój profil zyskuje luksusową oprawę, a Ty otrzymujesz zestaw narzędzi, które sprawią, że Twoja widoczność wzrośnie o ponad 400%. To inwestycja w Twoje życie towarzyskie i emocjonalne, wspierana przez technologię HardbanRecords Lab.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic text-amber-500">2. Nielimitowane Polubienia i Szepty (Direct Messages)</h3>
            <p>
              Największą frustracją w portalach randkowych są limity. W Spark Premium one nie istnieją. Możesz przesuwać w prawo i wysyłać polubienia bez końca. Twoja szansa na "Iskrę" jest ograniczona tylko Twoją wyobraźnią. Co więcej, użytkownicy Premium zyskują dostęp do funkcji "Szepty" – możliwości wysłania bezpośredniej wiadomości do kogoś, kto wpadł Ci w oko, jeszcze przed uzyskaniem dopasowania (match).
            </p>
            <p>
              To potężne narzędzie pozwala Ci wyróżnić się i pokazać zainteresowanie w sposób bezpośredni i pewny siebie. W połączeniu z nielimitowanymi powrotami (Rewind), nigdy nie stracisz szansy na poznanie kogoś wyjątkowego, nawet jeśli przez przypadek przesunąłeś profil w lewo.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic text-amber-500">3. System Spark Coins i Ekskluzywne Prezenty</h3>
            <p>
              Jako członek Spark Elite otrzymujesz regularne pakiety Spark Coins – naszej wirtualnej waluty premium. Spark Coins pozwalają Ci na interakcję na zupełnie nowym poziomie. Możesz wysyłać wirtualne prezenty podczas transmisji wideo w Vibe Rooms, co nie tylko przyciąga uwagę odbiorcy, ale również podnosi Twój status w społeczności.
            </p>
            <p>
              Coinsy możesz również wykorzystać do aktywacji funkcji "Boost", która sprawia, że Twój profil staje się numerem jeden w okolicy na 30 minut. Wyobraź sobie, że każdy, kto w tym momencie uruchomi Spark Connect w Twoim mieście, zobaczy Cię jako pierwszą osobę. To gwarantowana fala nowych powiadomień i zainteresowania, której nie da się porównać z niczym innym.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider italic text-amber-500">4. Kto Cię Polubił? (Secret Insights)</h3>
            <p>
              Jedną z najbardziej pożądanych funkcji Premium jest możliwość podejrzenia, kto już wyraził Tobą zainteresowanie. Zamiast czekać na ślepy traf, możesz wejść w sekcję "Lajki" i zobaczyć pełną listę osób, które już przesunęły Twój profil w prawo. To pozwala Ci na natychmiastowe tworzenie dopasowań z osobami, które na pewno chcą Cię poznać.
            </p>
            <p>
              Status Premium to także brak reklam, pełny dostęp do historii odwiedzin Twojego profilu (Visitors) oraz priorytetowe wsparcie techniczne 24/7. Wybierając Spark Premium, wybierasz najwyższą jakość, jaką Studio HRL Adult przygotowało dla najbardziej wymagających użytkowników.
            </p>
          </section>

          <div className="grid grid-cols-2 gap-4 py-8 border-y border-white/5">
            {[
              { title: 'Unlimited Likes', icon: <Heart className="text-primary" /> },
              { title: 'Top Priority', icon: <Zap className="text-amber-500" /> },
              { title: 'Direct Messages', icon: <Star className="text-blue-500" /> },
              { title: 'Secret Insights', icon: <Gem className="text-purple-500" /> },
            ].map((item, i) => (
              <div key={i} className="glass p-4 rounded-3xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">{item.icon}</div>
                <span className="text-xs font-black uppercase tracking-widest">{item.title}</span>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-white/40">Gwarancje Elite Premium:</h4>
            <div className="space-y-3">
              {[
                'Priorytetowe wyświetlanie w Discovery Grid',
                'Dostęp do zamkniętych pokoi Vibe Rooms Elite',
                'Możliwość ukrycia wieku i dystansu',
                'Brak jakichkolwiek reklam wewnątrz portalu',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 animate-pulse">
                <Sparkles className="w-3 h-3" /> Polecane przez 94% użytkowników
             </div>
            <button onClick={() => navigate('/')} className="gradient-fire px-10 py-4 rounded-full font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(255,26,78,0.3)] transition-all hover:scale-105 active:scale-95">
              Odblokuj Premium Teraz
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PremiumInfo;

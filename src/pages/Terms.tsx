import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronLeft, Scale, FileText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 glass rounded-full flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">Regulamin Serwisu</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8 text-white/80 leading-relaxed text-justify"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl gradient-fire flex items-center justify-center">
              <Scale className="text-white w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Dokumentacja Prawna</p>
              <h2 className="text-2xl font-black uppercase">Regulamin Spark Connect</h2>
            </div>
          </div>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider">1. Postanowienia Ogólne</h3>
            <p>
              Niniejszy Regulamin określa zasady korzystania z portalu Spark Connect (dalej: "Portal"), dostępnego pod adresem spark-connect.hardbanrecordslab.online. Właścicielem i administratorem Portalu jest firma Studio HRL Adult, stanowiąca integralną część grupy kapitałowej HardbanRecords Lab (dalej: "Administrator"). 
            </p>
            <p>
              Portal Spark Connect jest platformą społecznościową przeznaczoną wyłącznie dla osób pełnoletnich (18+), służącą do nawiązywania relacji, komunikacji wideo oraz interakcji w czasie rzeczywistym. Rejestracja w Portalu jest równoznaczna z akceptacją niniejszego Regulaminu w całości oraz zobowiązaniem się do przestrzegania wszystkich jego postanowień. Administrator zastrzega sobie prawo do weryfikacji tożsamości użytkowników w celu zapewnienia bezpieczeństwa społeczności.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider">2. Warunki Korzystania i Rejestracja</h3>
            <p>
              Użytkownikiem Portalu może być wyłącznie osoba fizyczna, która ukończyła 18 lat i posiada pełną zdolność do czynności prawnych. Administrator nie toleruje obecności osób niepełnoletnich i stosuje rygorystyczne metody weryfikacji wiekowej. Każdy Użytkownik może posiadać tylko jedno konto. Zakładanie kont fikcyjnych, tzw. "botów", jest surowo zabronione i skutkuje natychmiastowym usunięciem profilu bez możliwości odwołania.
            </p>
            <p>
              Użytkownik zobowiązuje się do podawania prawdziwych danych profilowych. Portal Spark Connect stawia na autentyczność, dlatego wszelkie próby podszywania się pod inne osoby, celebrytów czy marki będą traktowane jako poważne naruszenie Regulaminu. Administrator ma prawo żądać weryfikacji fotograficznej (tzw. "selfie verification") w dowolnym momencie trwania sesji Użytkownika.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider">3. Program Ambasadorski i Polecenia</h3>
            <p>
              W związku z polityką budowania autentycznej społeczności "No Bots Policy", Administrator wprowadza Program Ambasadorski Spark Connect. Użytkownicy są zachęcani do zapraszania nowych, realnych osób do Portalu przy użyciu unikalnych linków polecających. Za każdą skuteczną rejestrację nowego Użytkownika, Polecający może otrzymać wynagrodzenie w postaci wirtualnej waluty Spark Coins lub czasowego dostępu do funkcji Premium.
            </p>
            <p>
              Wykorzystywanie programów do automatycznego generowania poleceń, spamowanie linkami na forach zewnętrznych bez zgody administratorów tych forów, czy inne formy nadużyć systemu poleceń, są zabronione i mogą skutkować zablokowaniem naliczonych premii oraz zawieszeniem konta. System poleceń ma na celu naturalny rozwój społeczności opartej na zaufaniu i realnych interakcjach.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider">4. Zasady Zachowania i Treści</h3>
            <p>
              Portal promuje kulturę szacunku i otwartości. Zabronione jest publikowanie treści nawołujących do nienawiści, dyskryminacji, przemocy oraz treści nielegalnych w świetle prawa polskiego i międzynarodowego. Mimo że Portal jest przeznaczony dla dorosłych (Adult), zabrania się publikowania treści przedstawiających przemoc seksualną, zoofilię, pedofilię oraz inne dewiacje prawnie zabronione.
            </p>
            <p>
              Użytkownik ponosi pełną odpowiedzialność za treści publikowane na swoim profilu oraz przesyłane w wiadomościach prywatnych i podczas transmisji wideo. Administrator nie monitoruje wszystkich prywatnych rozmów w czasie rzeczywistym, jednak reaguje niezwłocznie na każde zgłoszenie naruszenia zasad (Report Button). Użytkownicy notorycznie zgłaszani przez społeczność będą poddawani weryfikacji i potencjalnemu wykluczeniu z Portalu.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider">5. Ochrona Prywatności i Danych</h3>
            <p>
              Administrator, działając jako Studio HRL Adult w ramach HardbanRecords Lab, przywiązuje najwyższą wagę do ochrony danych osobowych Użytkowników. Wszystkie dane są przetwarzane zgodnie z rozporządzeniem RODO (GDPR). Szczegółowe zasady przetwarzania danych, w tym prawo do ich usunięcia i przenoszenia, określa "Polityka Prywatności", która stanowi integralną część niniejszego Regulaminu.
            </p>
            <p>
              Wszelka komunikacja wideo na żywo (Vibe Rooms, Roulette) odbywa się przy użyciu szyfrowania, jednak Użytkownik musi mieć świadomość, że inni Użytkownicy mogą rejestrować ekran za pomocą oprogramowania zewnętrznego. Administrator nie ponosi odpowiedzialności za czyny osób trzecich naruszające prywatność Użytkownika, ale deklaruje pełną współpracę z organami ścigania w przypadku wykrycia przestępstwa.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider">6. Płatności i Wirtualna Waluta</h3>
            <p>
              Korzystanie z podstawowych funkcji Portalu jest bezpłatne. Portal jest finansowany z wyświetlania reklam oraz sprzedaży dobrowolnej waluty wirtualnej Spark Coins. Spark Coins służą do wysyłania prezentów innym Użytkownikom, wyróżniania swojego profilu oraz odblokowywania funkcji specjalnych. Waluta ta nie podlega wymianie na realne pieniądze i nie może być przedmiotem handlu poza Portalem.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider">7. Postanowienia Końcowe</h3>
            <p>
              Administrator zastrzega sobie prawo do zmiany niniejszego Regulaminu w dowolnym momencie. O wszelkich istotnych zmianach Użytkownicy zostaną powiadomieni drogą elektroniczną. W sprawach nieuregulowanych niniejszym Regulaminem mają zastosowanie przepisy Kodeksu Cywilnego oraz innych ustaw obowiązujących na terytorium Rzeczypospolitej Polskiej. Kontakt z administratorem jest możliwy pod adresem: spark-connect@hardbanrecordslab.online.
            </p>
            <p className="text-xs text-white/40 italic pt-8">
              Ostatnia aktualizacja: 12 maja 2026 r. <br />
              Dokument sporządzony dla: Studio HRL Adult / HardbanRecords Lab.
            </p>
          </section>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
              <AlertCircle className="w-3 h-3" /> Minimum 18 lat
            </div>
            <button onClick={() => navigate(-1)} className="gradient-fire px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-xl">
              Akceptuję i wracam
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Terms;

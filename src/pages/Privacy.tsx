import { motion } from 'framer-motion';
import { ChevronLeft, Lock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSeo } from '@/hooks/useSeo';

const Privacy = () => {
  const navigate = useNavigate();

  useSeo({
    title: 'Polityka Prywatności',
    description: 'Polityka prywatności Spark Connect: jakie dane zbieramy, jak je przetwarzamy i chronimy oraz jakie masz prawa jako użytkownik.',
    path: '/privacy',
  });

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 glass rounded-full flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">Polityka Prywatności</h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8 text-white/80 leading-relaxed text-justify"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <ShieldCheck className="text-blue-400 w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em]">Bezpieczeństwo Danych</p>
              <h2 className="text-2xl font-black uppercase">Polityka Prywatności</h2>
            </div>
          </div>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider">1. Informacje o Administratorze Danych</h3>
            <p>
              Administratorem danych osobowych Użytkowników portalu Spark Connect jest firma Studio HRL Adult, będąca częścią grupy HardbanRecords Lab (dalej: "Administrator"). Możesz skontaktować się z nami pisząc na adres e-mail: spark-connect@hardbanrecordslab.online. Administrator wyznaczył Inspektora Ochrony Danych, który nadzoruje procesy przetwarzania informacji w celu zapewnienia ich maksymalnego bezpieczeństwa i zgodności z przepisami RODO.
            </p>
            <p>
              Twoja prywatność jest dla nas priorytetem. Jako portal dedykowany dla dorosłych, rozumiemy wrażliwość przetwarzanych informacji i stosujemy zaawansowane mechanizmy szyfrowania oraz anonimizacji danych wszędzie tam, gdzie jest to możliwe. Niniejszy dokument wyjaśnia, jakie dane zbieramy, dlaczego to robimy i jakie prawa przysługują Ci w związku z ich przetwarzaniem.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider">2. Zakres Zbieranych Danych</h3>
            <p>
              Podczas rejestracji i korzystania z Portalu zbieramy następujące kategorie danych:
              <ul className="list-disc ml-6 space-y-2 mt-2 text-sm">
                <li>Dane identyfikacyjne: adres e-mail, nazwa użytkownika (pseudonim).</li>
                <li>Dane profilowe: wiek, płeć, orientacja seksualna, zainteresowania, opis profilu oraz zdjęcia.</li>
                <li>Dane techniczne: adres IP, typ przeglądarki, system operacyjny, unikalny identyfikator urządzenia.</li>
                <li>Dane o lokalizacji: miasto i przybliżone współrzędne geograficzne (w celu dopasowania osób w okolicy).</li>
                <li>Dane z komunikacji: treść wiadomości przesyłanych wewnątrz Portalu (szyfrowane na poziomie bazy danych).</li>
              </ul>
            </p>
            <p>
              Administrator nie ma dostępu do Twoich haseł – są one przechowywane w formie zahaszowanej przy użyciu nowoczesnych algorytmów kryptograficznych. Przesyłanie zdjęć o charakterze intymnym odbywa się na wyłączną odpowiedzialność Użytkownika, a Administrator zapewnia techniczne środki ograniczające możliwość ich nieautoryzowanego pobierania przez osoby trzecie.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider">3. Cele i Podstawa Przetwarzania</h3>
            <p>
              Twoje dane przetwarzamy w następujących celach:
              <ul className="list-disc ml-6 space-y-2 mt-2 text-sm">
                <li>Realizacja usług Portalu: Tworzenie profilu, dopasowywanie partnerów, umożliwienie komunikacji (Art. 6 ust. 1 lit. b RODO).</li>
                <li>Zapewnienie bezpieczeństwa: Wykrywanie oszustw, botów oraz weryfikacja wieku (Art. 6 ust. 1 lit. f RODO – prawnie uzasadniony interes).</li>
                <li>Program Ambasadorski: Rozliczanie poleceń i przyznawanie nagród za zapraszanie nowych Użytkowników.</li>
                <li>Marketing: Przesyłanie newsletterów oraz powiadomień o nowych dopasowaniach (wyłącznie za Twoją zgodą – Art. 6 ust. 1 lit. a RODO).</li>
              </ul>
            </p>
            <p>
              Dane dotyczące Twoich preferencji (orientacja, zainteresowania) są przetwarzane na podstawie Twojej wyraźnej zgody wyrażonej poprzez uzupełnienie profilu. Pamiętaj, że w każdej chwili możesz edytować lub usunąć te informacje ze swojego konta.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider">4. Udostępnianie Danych Osobom Trzecim</h3>
            <p>
              Twoje dane nie są sprzedawane podmiotom zewnętrznym. Mogą być one jednak udostępniane zaufanym partnerom technologicznym (tzw. procesorom), którzy pomagają nam w utrzymaniu Portalu:
              <ul className="list-disc ml-6 space-y-2 mt-2 text-sm">
                <li>Dostawcy infrastruktury chmurowej (np. Supabase, AWS).</li>
                <li>Dostawcy usług analitycznych (w formie zanonimizowanej).</li>
                <li>Dostawcy systemów do weryfikacji tożsamości (w przypadku zgłoszenia naruszenia).</li>
              </ul>
            </p>
            <p>
              Administrator może zostać zobowiązany do udostępnienia Twoich danych organom ścigania (Policja, Prokuratura) na podstawie wiążącego nakazu prawnego, w szczególności w przypadku podejrzenia popełnienia przestępstwa o charakterze seksualnym wobec osób niepełnoletnich lub innych ciężkich naruszeń prawa.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider">5. Twoje Prawa (RODO)</h3>
            <p>
              W związku z przetwarzaniem danych przysługują Ci następujące uprawnienia:
              <ul className="list-disc ml-6 space-y-2 mt-2 text-sm">
                <li>Prawo dostępu do swoich danych oraz otrzymania ich kopii.</li>
                <li>Prawo do sprostowania (poprawiania) swoich danych.</li>
                <li>Prawo do usunięcia danych ("prawo do bycia zapomnianym") – możesz to zrobić samodzielnie w ustawieniach konta.</li>
                <li>Prawo do ograniczenia przetwarzania oraz prawo do przenoszenia danych.</li>
                <li>Prawo do sprzeciwu wobec przetwarzania danych na podstawie prawnie uzasadnionego interesu.</li>
              </ul>
            </p>
            <p>
              Masz również prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (UODO), jeżeli uważasz, że przetwarzanie Twoich danych narusza przepisy prawa.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider">6. Okres Przechowywania Danych</h3>
            <p>
              Dane przechowujemy przez okres posiadania przez Ciebie aktywnego konta w Portalu. W przypadku usunięcia konta, Twoje dane są trwale usuwane z naszych baz produkcyjnych w ciągu 30 dni, z wyjątkiem informacji, które musimy zachować w celu obrony przed roszczeniami lub wypełnienia obowiązków prawnych (np. logi systemowe przechowywane przez okres wynikający z przepisów telekomunikacyjnych).
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-bold text-lg uppercase tracking-wider">7. Pliki Cookies i Technologie Śledzące</h3>
            <p>
              Cookies niezbędne (sesja logowania, ustawienia interfejsu) są stosowane zawsze, ponieważ bez nich Portal nie może działać. Cookies reklamowe i analityczne są uruchamiane wyłącznie po wyrażeniu przez Ciebie zgody w bannerze cookies wyświetlanym przy pierwszej wizycie — możesz ją w każdej chwili wycofać, czyszcząc dane strony w ustawieniach przeglądarki. Korzystamy również z tzw. "Local Storage" do przechowywania Twoich tymczasowych ustawień interfejsu.
            </p>
            <p className="text-xs text-white/40 italic pt-8 border-t border-white/5">
              Polityka Prywatności zaktualizowana: 12 maja 2026 r. <br />
              Wydawca: Studio HRL Adult / HardbanRecords Lab.
            </p>
          </section>

          <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
              <Lock className="w-3 h-3" /> Twoje dane są szyfrowane
            </div>
            <button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-xl transition-all">
              Rozumiem i akceptuję
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Privacy;

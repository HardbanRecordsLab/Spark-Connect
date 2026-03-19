import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CONTACT = 'spark-connect@hardbanrecordslab.online';
const APP = 'Spark Connect';
const DOMAIN = 'spark-connect.hardbanrecordslab.online';
const DATE = '18 marca 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold text-foreground border-l-2 border-primary pl-3">{title}</h2>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

export default function TermsOfService() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-lg">Regulamin Serwisu</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-5 py-8 space-y-8 text-sm leading-relaxed"
      >
        <div className="glass rounded-2xl p-4 border border-border/50">
          <p className="text-xs text-muted-foreground">Ostatnia aktualizacja: <strong>{DATE}</strong></p>
          <p className="text-xs text-muted-foreground mt-1">
            Niniejszy Regulamin reguluje korzystanie z aplikacji {APP} dostępnej pod adresem{' '}
            <span className="text-primary">{DOMAIN}</span>.
            Przed rejestracją prosimy o uważne zapoznanie się z jego treścią.
          </p>
        </div>

        {/* ─── 1 ─── */}
        <Section title="§ 1. Postanowienia ogólne">
          <p>
            1.1. Serwis {APP} („Serwis" lub „Aplikacja") jest platformą internetową przeznaczoną
            dla dorosłych umożliwiającą nawiązywanie kontaktów towarzyskich, romantycznych i erotycznych
            pomiędzy zarejestrowanymi użytkownikami. Serwis prowadzony jest pod domeną <strong>{DOMAIN}</strong>.
          </p>
          <p>
            1.2. Operatorem Serwisu jest właściciel domeny hardbanrecordslab.online, dostępny
            pod adresem e-mail: <span className="text-primary">{CONTACT}</span>.
          </p>
          <p>
            1.3. Korzystanie z Serwisu — w tym sama rejestracja — oznacza bezwarunkową akceptację
            niniejszego Regulaminu oraz Polityki Prywatności. Jeżeli nie akceptujesz warunków,
            niezwłocznie zaprzestań korzystania z Serwisu.
          </p>
          <p>
            1.4. Regulamin dostępny jest w każdej chwili pod adresem <span className="text-primary">{DOMAIN}/terms</span>.
          </p>
        </Section>

        {/* ─── 2 ─── */}
        <Section title="§ 2. Wymogi wiekowe i weryfikacja">
          <p>
            2.1. Serwis przeznaczony jest <strong>wyłącznie dla osób, które ukończyły 18 lat</strong> (pełnoletnich).
            Rejestracja przez osoby niepełnoletnie jest bezwzględnie zakazana.
          </p>
          <p>
            2.2. Rejestrując się, potwierdzasz pod rygorem odpowiedzialności prawnej, że jesteś
            osobą pełnoletnią oraz że w Twoim kraju zamieszkania korzystanie z tego rodzaju serwisów
            przez osoby w Twoim wieku jest legalne.
          </p>
          <p>
            2.3. Operator zastrzega prawo do żądania potwierdzenia wieku w dowolnym momencie.
            Odmowa weryfikacji może skutkować zawieszeniem konta.
          </p>
          <p>
            2.4. Jeżeli Operator uzyska uzasadnione podejrzenie, że użytkownik jest niepełnoletni,
            konto zostanie natychmiast zablokowane, a sprawa może zostać zgłoszona właściwym organom.
          </p>
        </Section>

        {/* ─── 3 ─── */}
        <Section title="§ 3. Rejestracja i konto użytkownika">
          <p>3.1. Rejestracja wymaga podania aktywnego adresu e-mail oraz hasła, lub zalogowania
            przez konto Google. Możliwe jest też logowanie przez Apple ID.</p>
          <p>3.2. Każdy użytkownik może posiadać tylko jedno konto. Tworzenie wielu kont przez
            tę samą osobę jest zabronione.</p>
          <p>3.3. Dane podane przy rejestracji muszą być prawdziwe. Zabrania się tworzenia profili
            pod fałszywą tożsamością lub podszywania się pod inne osoby.</p>
          <p>3.4. Użytkownik jest odpowiedzialny za zachowanie poufności swoich danych logowania.
            Operator nie ponosi odpowiedzialności za szkody wynikające z nieuprawnionego dostępu
            do konta spowodowanego przez ujawnienie hasła przez użytkownika.</p>
          <p>3.5. Każdy profil użytkownika podlega ręcznej weryfikacji przez administratora przed
            jego opublikowaniem. Operator zastrzega prawo odmowy aktywacji profilu bez podania przyczyny.</p>
          <p>3.6. Użytkownik może w dowolnym momencie usunąć swoje konto — opcja dostępna
            w Ustawieniach aplikacji. Po usunięciu konta dane są usuwane zgodnie z Polityką Prywatności.</p>
        </Section>

        {/* ─── 4 ─── */}
        <Section title="§ 4. Zasady korzystania z Serwisu">
          <p>4.1. Użytkownicy zobowiązani są do korzystania z Serwisu zgodnie z prawem, dobrymi
            obyczajami oraz poszanowaniem praw innych użytkowników.</p>
          <p>4.2. <strong>Bezwzględnie zabrania się:</strong></p>
          <ul className="list-none space-y-1.5 pl-2">
            {[
              'zamieszczania treści seksualnych z udziałem osób nieletnich (CSAM) — podlega zgłoszeniu do organów ścigania i jest przestępstwem',
              'udostępniania treści bez zgody osób na nich widocznych (tzw. revenge porn)',
              'nękania, stalkingu, szantażu lub gróźb wobec innych użytkowników',
              'rozpowszechniania mowy nienawiści, treści rasistowskich, dyskryminujących',
              'tworzenia fałszywych profili, podszywania się pod inne osoby lub celebrytów',
              'wysyłania spamu, niechcianych reklam lub linków do złośliwego oprogramowania',
              'udostępniania danych osobowych innych użytkowników bez ich wyraźnej zgody',
              'prowadzenia działalności zarobkowej (np. escortu, prostytucji) w Serwisie',
              'zbierania danych innych użytkowników w sposób zautomatyzowany (scraping)',
              'prób obejścia systemu weryfikacji age-gate lub innych zabezpieczeń',
              'używania botów, skryptów lub sztucznej inteligencji do generowania profili',
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary flex-shrink-0">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p>4.3. Operator zastrzega prawo do oceny zachowań jako naruszających Regulamin
            nawet jeśli nie zostały wprost wymienione w punkcie 4.2.</p>
        </Section>

        {/* ─── 5 ─── */}
        <Section title="§ 5. Treści użytkowników (UGC)">
          <p>
            5.1. Zamieszczając treści w Serwisie (zdjęcia, wideo, wiadomości, opisy), udzielasz
            Operatorowi niewyłącznej, bezpłatnej licencji na ich przechowywanie, wyświetlanie
            i przetwarzanie wyłącznie w celu świadczenia usług Serwisu.
          </p>
          <p>
            5.2. Pozostajesz wyłącznym właścicielem swoich treści. Operator nie rości sobie
            praw do ich dalszego wykorzystywania poza Serwisem.
          </p>
          <p>
            5.3. Zamieszczając zdjęcia lub wideo, oświadczasz że:
          </p>
          <ul className="list-none space-y-1 pl-2">
            <li className="flex gap-2"><span className="text-primary flex-shrink-0">—</span><span>jesteś osobą widoczną na materiale lub posiadasz zgodę wszystkich widocznych osób</span></li>
            <li className="flex gap-2"><span className="text-primary flex-shrink-0">—</span><span>wszystkie widoczne osoby są pełnoletnie</span></li>
            <li className="flex gap-2"><span className="text-primary flex-shrink-0">—</span><span>materiał nie narusza praw autorskich ani innych praw osób trzecich</span></li>
          </ul>
          <p>
            5.4. Operator stosuje automatyczną detekcję treści NSFW przy uploadzie. Treści
            uznane za nielegalne są usuwane, a użytkownicy mogą zostać zgłoszeni organom ścigania.
          </p>
          <p>
            5.5. Wiadomości prywatne pomiędzy użytkownikami są poufne. Operator nie czyta
            wiadomości prywatnych z wyjątkiem przypadków prawnie wymaganych lub przy rozpatrywaniu
            zgłoszeń o naruszenie.
          </p>
        </Section>

        {/* ─── 6 ─── */}
        <Section title="§ 6. System prywatnych zdjęć">
          <p>
            6.1. Serwis umożliwia dodanie „prywatnej galerii" — zdjęć widocznych wyłącznie
            dla osób, którym użytkownik udzieli dostępu poprzez system próśb.
          </p>
          <p>
            6.2. Użytkownik udzielający dostępu robi to dobrowolnie i może go cofnąć w każdej chwili.
          </p>
          <p>
            6.3. Pobieranie, zapisywanie i dalsze udostępnianie treści z prywatnych galerii
            bez wyraźnej zgody ich właściciela jest surowo zabronione i może stanowić
            podstawę do postępowania cywilnego lub karnego.
          </p>
        </Section>

        {/* ─── 7 ─── */}
        <Section title="§ 7. Bezpłatność Serwisu i reklamy">
          <p>
            7.1. Spark Connect jest <strong>całkowicie bezpłatny</strong> — wszystkie podstawowe funkcje
            (swipe, dopasowania, czat, speed dating, prywatne zdjęcia, roulette) dostępne są
            bez żadnych opłat.
          </p>
          <p>
            7.2. Serwis finansowany jest wyłącznie z reklam wyświetlanych użytkownikom.
            Część funkcji premium dostępna jest po obejrzeniu reklamy nagrodzonej (rewarded ad)
            zamiast płatności.
          </p>
          <p>
            7.3. Operator może w przyszłości wprowadzić dobrowolne opcje wsparcia Serwisu.
            Wszelkie zmiany zostaną ogłoszone z co najmniej 30-dniowym wyprzedzeniem.
          </p>
        </Section>

        {/* ─── 8 ─── */}
        <Section title="§ 8. Weryfikacja profili i moderacja">
          <p>
            8.1. Każdy profil przed aktywacją podlega ręcznej weryfikacji przez administratora.
            Operator sprawdza autentyczność zdjęć i weryfikuje czy profil nie narusza Regulaminu.
          </p>
          <p>
            8.2. Operator zastrzega prawo do usunięcia lub zablokowania treści naruszających
            Regulamin bez ostrzeżenia oraz do zawieszenia lub trwałego zablokowania konta.
          </p>
          <p>
            8.3. Użytkownicy mogą zgłaszać profile i treści naruszające Regulamin poprzez
            przycisk „Zgłoś" w aplikacji lub na adres <span className="text-primary">{CONTACT}</span>.
          </p>
          <p>
            8.4. Zgłoszenia rozpatrywane są w ciągu 72 godzin roboczych. W przypadkach
            naglących (CSAM, przemoc) — niezwłocznie.
          </p>
        </Section>

        {/* ─── 9 ─── */}
        <Section title="§ 9. Ograniczenie odpowiedzialności">
          <p>
            9.1. Serwis nie weryfikuje prawdziwości informacji podanych przez użytkowników
            poza procedurą opisaną w §8 i nie odpowiada za treści zamieszczone przez użytkowników.
          </p>
          <p>
            9.2. Operator nie ponosi odpowiedzialności za szkody wynikłe ze spotkań
            umówionych za pośrednictwem Serwisu. Korzystasz z Serwisu na własną odpowiedzialność.
            Zachowaj ostrożność przy poznawaniu osób online i spotykaniu się z nimi.
          </p>
          <p>
            9.3. Operator nie gwarantuje ciągłości działania Serwisu i nie ponosi
            odpowiedzialności za szkody wynikłe z przerw technicznych, błędów oprogramowania
            lub ataków hakerskich.
          </p>
          <p>
            9.4. Operator dołoży wszelkich starań aby Serwis działał bez zakłóceń 24/7,
            jednak planowane przerwy serwisowe mogą się zdarzać i będą ogłaszane z wyprzedzeniem.
          </p>
        </Section>

        {/* ─── 10 ─── */}
        <Section title="§ 10. Ochrona danych osobowych">
          <p>
            10.1. Przetwarzanie danych osobowych odbywa się zgodnie z Rozporządzeniem (UE) 2016/679
            (RODO) i zostało szczegółowo opisane w <button onClick={() => useNavigate()('/privacy')} className="text-primary underline">Polityce Prywatności</button>.
          </p>
          <p>
            10.2. Kontakt w sprawach ochrony danych: <span className="text-primary">{CONTACT}</span>
          </p>
        </Section>

        {/* ─── 11 ─── */}
        <Section title="§ 11. Prawo właściwe i rozstrzyganie sporów">
          <p>
            11.1. Regulamin podlega prawu polskiemu.
          </p>
          <p>
            11.2. Wszelkie spory pomiędzy Operatorem a użytkownikami będą rozstrzygane przez
            sądy powszechne właściwe dla siedziby Operatora, chyba że przepisy bezwzględnie
            obowiązujące stanowią inaczej.
          </p>
          <p>
            11.3. Użytkownicy będący konsumentami mogą korzystać z pozasądowych metod
            rozstrzygania sporów, w tym z platformy ODR Komisji Europejskiej dostępnej pod
            adresem <span className="text-primary">ec.europa.eu/consumers/odr</span>.
          </p>
          <p>
            11.4. Jeżeli którekolwiek postanowienie Regulaminu zostanie uznane za nieważne,
            pozostałe postanowienia pozostają w mocy.
          </p>
        </Section>

        {/* ─── 12 ─── */}
        <Section title="§ 12. Zmiany Regulaminu">
          <p>
            12.1. Operator zastrzega prawo do zmiany Regulaminu. O wszelkich zmianach
            użytkownicy zostaną poinformowani poprzez powiadomienie w aplikacji lub e-mailem
            na co najmniej <strong>14 dni</strong> przed wejściem zmian w życie.
          </p>
          <p>
            12.2. Dalsze korzystanie z Serwisu po dacie wejścia zmian w życie oznacza
            ich akceptację. Jeżeli nie akceptujesz zmian, masz prawo usunąć swoje konto.
          </p>
        </Section>

        {/* ─── 13 ─── */}
        <Section title="§ 13. Kontakt">
          <p>
            We wszystkich sprawach dotyczących Serwisu prosimy o kontakt na adres:
          </p>
          <div className="glass rounded-xl p-4 mt-2">
            <p className="font-semibold">{APP}</p>
            <p className="text-primary mt-1">{CONTACT}</p>
            <p className="text-xs text-muted-foreground mt-1">Odpowiadamy w ciągu 2 dni roboczych</p>
          </div>
        </Section>

        <div className="glass rounded-2xl p-5 text-center border border-border/40">
          <p className="text-xs text-muted-foreground">
            © 2026 {APP} · {DOMAIN} · Wszelkie prawa zastrzeżone
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <button onClick={() => navigate('/privacy')} className="text-xs text-primary underline">Polityka Prywatności</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CONTACT = 'spark-connect@hardbanrecordslab.online';
const APP = 'Spark Connect';
const OWNER = 'Studio HRL Adult';
const PARENT_COMPANY = 'HardbanRecords Lab';
const DOMAIN = 'spark-connect.hardbanrecordslab.online';
const DATE = '24 marca 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold text-foreground border-l-2 border-primary pl-3">{title}</h2>
      <div className="space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-border/40 last:border-0">
      <span className="font-medium text-foreground w-40 flex-shrink-0">{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-0.5 shadow-lg border-2 border-primary/20 overflow-hidden">
            <img src="/studio hrl adult.jpeg" alt="Studio HRL Adult" className="w-full h-full object-contain rounded-full mix-blend-multiply scale-125" />
          </div>
          <h1 className="font-bold text-lg">Polityka Prywatności</h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto px-5 py-8 space-y-8 text-sm leading-relaxed"
      >
        <div className="text-center mb-10">
          <div className="w-40 h-40 rounded-full bg-white mx-auto flex items-center justify-center p-0 shadow-[0_0_50px_rgba(255,215,0,0.3)] mb-6 border-4 border-white relative overflow-hidden group">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 animate-pulse" />
            <img src="/studio hrl adult.jpeg" alt="Studio HRL Adult Logo" className="w-full h-full object-contain rounded-full mix-blend-multiply scale-125 relative z-10" />
          </div>
          <h2 className="text-3xl font-black gradient-luxury-text uppercase tracking-tighter italic drop-shadow-md">{OWNER}</h2>
          <p className="text-xs text-muted-foreground mt-1 tracking-[0.4em] font-black opacity-60 uppercase">Owned by {PARENT_COMPANY}</p>
        </div>

        <div className="glass rounded-2xl p-4 border border-border/50">
          <p className="text-xs text-muted-foreground">Ostatnia aktualizacja: <strong>{DATE}</strong></p>
          <p className="text-xs text-muted-foreground mt-1">
            Niniejsza Polityka Prywatności opisuje sposób, w jaki <strong>{OWNER}</strong> (studio należące do <strong>{PARENT_COMPANY}</strong>) zbiera, przetwarza
            i chroni Twoje dane osobowe w ramach aplikacji {APP} zgodnie z Rozporządzeniem (UE) 2016/679 (RODO).
          </p>
        </div>

        {/* ─── 1 ─── */}
        <Section title="1. Administrator danych osobowych">
          <p>
            Administratorem Twoich danych osobowych jest <strong>{OWNER}</strong> (własność <strong>{PARENT_COMPANY}</strong>),
            dostępny pod adresem: <span className="text-primary">{CONTACT}</span>
          </p>
          <p>
            Serwis dostępny jest pod domeną: <span className="text-primary">{DOMAIN}</span>
          </p>
          <p>
            We wszelkich sprawach dotyczących ochrony danych osobowych możesz skontaktować się
            bezpośrednio na powyższy adres e-mail. Odpowiadamy w ciągu 72 godzin.
          </p>
        </Section>

        {/* ─── 2 ─── */}
        <Section title="2. Jakie dane zbieramy i w jakim celu">

          <p className="font-semibold text-foreground">2.1. Dane podawane przez Ciebie przy rejestracji</p>
          <div className="glass rounded-xl p-3">
            <Row label="Adres e-mail" value="Identyfikacja konta, komunikacja, reset hasła" />
            <Row label="Imię / pseudonim" value="Wyświetlanie na profilu publicznym" />
            <Row label="Wiek (data urodzenia)" value="Weryfikacja pełnoletności (wymóg 18+)" />
            <Row label="Płeć, orientacja" value="Personalizacja wyników matchmakingu" />
            <Row label="Miasto / lokalizacja" value="Pokazywanie profili w pobliżu" />
            <Row label="Bio, zainteresowania" value="Budowanie profilu i algorytm dopasowań" />
            <Row label="Zdjęcia profilowe" value="Wyświetlanie na profilu, weryfikacja przez admina" />
            <Row label="Preferencje randkowe" value="Algorytm chemistry score i dopasowań" />
          </div>

          <p className="font-semibold text-foreground mt-2">2.2. Dane zbierane automatycznie</p>
          <div className="glass rounded-xl p-3">
            <Row label="Adres IP" value="Bezpieczeństwo, wykrywanie nadużyć, geolokalizacja przybliżona" />
            <Row label="Typ urządzenia / przeglądarka" value="Optymalizacja działania aplikacji" />
            <Row label="Data i godzina logowania" value="Bezpieczeństwo konta, logi systemowe" />
            <Row label="Aktywność w aplikacji" value="Swipe'y, dopasowania, wiadomości — do działania usługi" />
            <Row label="Subskrypcja push" value="Wysyłanie powiadomień (za Twoją zgodą)" />
          </div>

          <p className="font-semibold text-foreground mt-2">2.3. Dane wrażliwe</p>
          <p>
            Serwis przetwarza dane dotyczące orientacji seksualnej i preferencji erotycznych,
            które są danymi wrażliwymi w rozumieniu art. 9 RODO. Przetwarzamy je wyłącznie
            na podstawie Twojej wyraźnej zgody udzielonej przy rejestracji, w celu świadczenia
            usług randkowych.
          </p>

          <p className="font-semibold text-foreground mt-2">2.4. Dane z integracji zewnętrznych</p>
          <p>
            Jeśli logujesz się przez Google, otrzymujemy od Google: adres e-mail, imię
            i zdjęcie profilowe — wyłącznie w zakresie udostępnionym przez Ciebie w ustawieniach Google.
            Nie mamy dostępu do Twojego hasła Google.
          </p>
        </Section>

        {/* ─── 3 ─── */}
        <Section title="3. Podstawa prawna przetwarzania (RODO)">
          <div className="glass rounded-xl p-3 space-y-3">
            <div>
              <p className="font-semibold text-foreground">Art. 6 ust. 1 lit. b — Wykonanie umowy</p>
              <p className="text-xs mt-0.5">Przetwarzanie niezbędne do świadczenia usług {APP} (konto, matchmaking, czat, dopasowania).</p>
            </div>
            <div className="border-t border-border/40 pt-2">
              <p className="font-semibold text-foreground">Art. 6 ust. 1 lit. a — Zgoda</p>
              <p className="text-xs mt-0.5">Powiadomienia push, marketing e-mail, dane wrażliwe (orientacja, preferencje), reklamy spersonalizowane. Możesz wycofać zgodę w dowolnej chwili w Ustawieniach.</p>
            </div>
            <div className="border-t border-border/40 pt-2">
              <p className="font-semibold text-foreground">Art. 6 ust. 1 lit. f — Prawnie uzasadniony interes</p>
              <p className="text-xs mt-0.5">Bezpieczeństwo platformy, wykrywanie oszustw, moderacja treści, ochrona przed botami, analityka techniczna.</p>
            </div>
            <div className="border-t border-border/40 pt-2">
              <p className="font-semibold text-foreground">Art. 6 ust. 1 lit. c — Obowiązek prawny</p>
              <p className="text-xs mt-0.5">Przechowywanie danych wymaganych przepisami podatkowymi, odpowiedzi na nakazy organów ścigania.</p>
            </div>
            <div className="border-t border-border/40 pt-2">
              <p className="font-semibold text-foreground">Art. 9 ust. 2 lit. a — Wyraźna zgoda (dane wrażliwe)</p>
              <p className="text-xs mt-0.5">Dane dotyczące orientacji seksualnej i preferencji erotycznych przetwarzane wyłącznie na podstawie Twojej wyraźnej zgody.</p>
            </div>
          </div>
        </Section>

        {/* ─── 4 ─── */}
        <Section title="4. Jak długo przechowujemy Twoje dane">
          <div className="glass rounded-xl p-3">
            <Row label="Konto aktywne" value="Przez cały czas korzystania z Serwisu" />
            <Row label="Po usunięciu konta" value="30 dni (backupy), następnie trwałe usunięcie" />
            <Row label="Wiadomości prywatne" value="Usuwane wraz z kontem (lub wcześniej na żądanie)" />
            <Row label="Wiadomości wygasające" value="Usuwane automatycznie po upływie ustawionego czasu" />
            <Row label="Logi bezpieczeństwa" value="Do 12 miesięcy (wykrywanie nadużyć)" />
            <Row label="Dane finansowe / prawne" value="Do 5 lat (wymóg ustawowy)" />
            <Row label="Eksport RODO" value="Link aktywny 1 godzinę po wygenerowaniu" />
          </div>
        </Section>

        {/* ─── 5 ─── */}
        <Section title="5. Komu udostępniamy Twoje dane">
          <p>
            <strong className="text-foreground">Nie sprzedajemy Twoich danych osobowych</strong> żadnym podmiotom
            trzecim. Dane mogą być udostępniane wyłącznie następującym kategoriom odbiorców:
          </p>
          <div className="glass rounded-xl p-3 space-y-3">
            <div>
              <p className="font-semibold text-foreground">Dostawcy infrastruktury technicznej</p>
              <p className="text-xs mt-0.5">
                <strong>Supabase</strong> (baza danych, auth, storage) — serwery w UE,
                umowa powierzenia przetwarzania danych, certyfikat SOC 2.
                <strong className="ml-1">Cloudflare</strong> (CDN, storage plików) — serwery globalne,
                umowa powierzenia, certyfikat ISO 27001.
                <strong className="ml-1">Vercel</strong> (hosting aplikacji) — serwery w UE/USA,
                Standard Contractual Clauses (SCC) dla transferów poza EOG.
              </p>
            </div>
            <div className="border-t border-border/40 pt-2">
              <p className="font-semibold text-foreground">Dostawca poczty e-mail</p>
              <p className="text-xs mt-0.5">
                <strong>Resend</strong> — wysyłanie e-maili transakcyjnych (powitanie, reset hasła, powiadomienia o matchach).
                Resend przetwarza wyłącznie adres e-mail odbiorcy i treść wiadomości.
              </p>
            </div>
            <div className="border-t border-border/40 pt-2">
              <p className="font-semibold text-foreground">Sieci reklamowe</p>
              <p className="text-xs mt-0.5">
                Dostawcy reklam mogą otrzymywać anonimowe, zagregowane dane o aktywności
                (np. liczba wyświetleń). Nie udostępniamy im danych identyfikacyjnych
                bez Twojej wyraźnej zgody. Możesz wyłączyć reklamy spersonalizowane w Ustawieniach.
              </p>
            </div>
            <div className="border-t border-border/40 pt-2">
              <p className="font-semibold text-foreground">Organy ścigania i sądy</p>
              <p className="text-xs mt-0.5">
                Wyłącznie na podstawie obowiązującego prawa, nakazu sądowego lub
                w przypadku uzasadnionego podejrzenia popełnienia przestępstwa (szczególnie CSAM).
              </p>
            </div>
          </div>
        </Section>

        {/* ─── 6 ─── */}
        <Section title="6. Transfery danych poza Europejski Obszar Gospodarczy (EOG)">
          <p>
            Część naszych dostawców (Cloudflare, Vercel) może przechowywać dane na serwerach poza EOG
            (w tym w USA). W takich przypadkach stosujemy odpowiednie zabezpieczenia:
          </p>
          <ul className="list-none space-y-1 pl-2">
            <li className="flex gap-2"><span className="text-primary flex-shrink-0">—</span><span>Standardowe Klauzule Umowne (SCC) zatwierdzone przez Komisję Europejską</span></li>
            <li className="flex gap-2"><span className="text-primary flex-shrink-0">—</span><span>Certyfikaty Data Privacy Framework (DPF) po stronie dostawców</span></li>
            <li className="flex gap-2"><span className="text-primary flex-shrink-0">—</span><span>Szyfrowanie danych w tranzycie (TLS 1.3) i w spoczynku (AES-256)</span></li>
          </ul>
        </Section>

        {/* ─── 7 ─── */}
        <Section title="7. Twoje prawa wynikające z RODO">
          <p>Jako osoba, której dane dotyczą, przysługują Ci następujące prawa:</p>
          <div className="glass rounded-xl p-3 space-y-3">
            {[
              { right: 'Prawo dostępu (art. 15)', desc: 'Możesz zażądać informacji o tym, jakie dane o Tobie przetwarzamy i otrzymać ich kopię. Skorzystaj z funkcji "Eksportuj moje dane" w Ustawieniach → RODO.' },
              { right: 'Prawo do sprostowania (art. 16)', desc: 'Możesz poprawić nieprawidłowe lub uzupełnić niekompletne dane bezpośrednio w profilu aplikacji.' },
              { right: 'Prawo do usunięcia (art. 17)', desc: '"Prawo do bycia zapomnianym" — możesz usunąć konto w Ustawieniach → Usuń konto. Dane zostaną usunięte w ciągu 30 dni.' },
              { right: 'Prawo do ograniczenia przetwarzania (art. 18)', desc: 'Możesz zażądać ograniczenia przetwarzania Twoich danych w określonych przypadkach wskazanych w RODO.' },
              { right: 'Prawo do przenoszenia danych (art. 20)', desc: 'Możesz otrzymać swoje dane w ustrukturyzowanym formacie (JSON) przez funkcję eksportu RODO w aplikacji.' },
              { right: 'Prawo sprzeciwu (art. 21)', desc: 'Możesz sprzeciwić się przetwarzaniu danych na podstawie prawnie uzasadnionego interesu, w tym profilowaniu do celów marketingowych.' },
              { right: 'Prawo do wycofania zgody', desc: 'Możesz wycofać zgodę w dowolnej chwili (np. wyłączając powiadomienia push w Ustawieniach). Wycofanie zgody nie wpływa na legalność wcześniejszego przetwarzania.' },
              { right: 'Prawo do skargi', desc: 'Masz prawo złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (PUODO), ul. Stawki 2, 00-193 Warszawa, e-mail: kancelaria@uodo.gov.pl' },
            ].map((item, i) => (
              <div key={i} className={i > 0 ? 'border-t border-border/40 pt-2' : ''}>
                <p className="font-semibold text-foreground text-xs">{item.right}</p>
                <p className="text-xs mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
          <p>
            Aby skorzystać z praw, skontaktuj się z nami:{' '}
            <span className="text-primary">{CONTACT}</span>.
            Odpowiemy w ciągu <strong>30 dni</strong> (w skomplikowanych sprawach — do 90 dni, z powiadomieniem).
          </p>
        </Section>

        {/* ─── 8 ─── */}
        <Section title="8. Bezpieczeństwo danych">
          <p>Stosujemy następujące środki techniczne i organizacyjne ochrony danych:</p>
          <ul className="list-none space-y-1.5 pl-2">
            {[
              'Szyfrowanie transmisji — TLS 1.3 dla wszystkich połączeń',
              'Szyfrowanie plików — AES-256 dla danych w spoczynku w Cloudflare R2',
              'Row-Level Security (RLS) — każdy użytkownik widzi tylko swoje dane w bazie',
              'Presigned URLs — pliki prywatne dostępne tylko przez czasowe, unikalne linki (ważne 1h)',
              'Automatyczne wykrywanie NSFW — analiza zdjęć przed publikacją',
              'Rate limiting — ochrona przed atakami brute-force i spamem',
              'Regularne kopie zapasowe bazy danych (Supabase — backup co 24h)',
              'Dostęp do danych ograniczony do minimum — zasada least privilege',
              'Monitorowanie bezpieczeństwa — logi dostępu i alerty anomalii',
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary flex-shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p>
            W przypadku naruszenia bezpieczeństwa danych osobowych, które może powodować
            wysokie ryzyko dla Twoich praw i wolności, poinformujemy Cię niezwłocznie
            zgodnie z art. 34 RODO.
          </p>
        </Section>

        {/* ─── 9 ─── */}
        <Section title="9. Pliki cookies i technologie śledzące">
          <p>Serwis używa następujących kategorii cookies:</p>
          <div className="glass rounded-xl p-3">
            <Row label="Niezbędne" value="Sesja logowania, preferencje interfejsu, age-gate — nie wymagają zgody" />
            <Row label="Analityczne" value="Statystyki odwiedzin (anonimowe, po zgonie) — możesz odrzucić" />
            <Row label="Reklamowe" value="Reklamy spersonalizowane (wyłącznie za Twoją zgodą) — możesz odrzucić" />
          </div>
          <p>
            Możesz zarządzać plikami cookies w ustawieniach przeglądarki lub przez baner cookies
            przy pierwszym odwiedzeniu strony. Wyłączenie cookies niezbędnych może wpłynąć
            na funkcjonowanie aplikacji.
          </p>
          <p>
            Serwis stosuje podejście "privacy by default" — domyślnie aktywne są wyłącznie
            cookies niezbędne do działania.
          </p>
        </Section>

        {/* ─── 10 ─── */}
        <Section title="10. Dzieci i osoby niepełnoletnie">
          <p>
            Serwis nie jest przeznaczony dla osób poniżej 18 roku życia i świadomie
            nie zbieramy danych od osób niepełnoletnich. Jeżeli dowiesz się że osoba
            niepełnoletnia korzysta z Serwisu lub że posiadamy jej dane, niezwłocznie
            skontaktuj się z nami na adres <span className="text-primary">{CONTACT}</span>.
            Usuniemy takie dane natychmiast.
          </p>
        </Section>

        {/* ─── 11 ─── */}
        <Section title="11. Prywatne zdjęcia — szczególne zasady">
          <p>
            System prywatnej galerii umożliwia przesyłanie zdjęć dostępnych wyłącznie
            dla osób, którym udzielisz dostępu. Takie zdjęcia:
          </p>
          <ul className="list-none space-y-1 pl-2">
            <li className="flex gap-2"><span className="text-primary flex-shrink-0">—</span><span>przechowywane są w prywatnym buckecie Cloudflare R2, niedostępnym publicznie</span></li>
            <li className="flex gap-2"><span className="text-primary flex-shrink-0">—</span><span>dostępne wyłącznie przez czasowe podpisane URL (ważne 1 godzinę) po weryfikacji uprawnień</span></li>
            <li className="flex gap-2"><span className="text-primary flex-shrink-0">—</span><span>nie są indeksowane przez wyszukiwarki ani dostępne bez autoryzacji</span></li>
            <li className="flex gap-2"><span className="text-primary flex-shrink-0">—</span><span>usuwane natychmiast po cofnięciu dostępu lub usunięciu zdjęcia przez użytkownika</span></li>
          </ul>
        </Section>

        {/* ─── 12 ─── */}
        <Section title="12. Eksport danych (prawo do przenoszenia — art. 20 RODO)">
          <p>
            Możesz w każdej chwili pobrać kompletny eksport swoich danych w formacie JSON
            poprzez: Ustawienia → RODO → Eksportuj moje dane.
          </p>
          <p>Eksport zawiera: profil, ustawienia, historię swipe'ów, liczbę dopasowań,
            statystyki wiadomości, subskrypcje powiadomień. Plik dostępny przez podpisany
            link ważny 1 godzinę od wygenerowania.</p>
        </Section>

        {/* ─── 13 ─── */}
        <Section title="13. Zmiany Polityki Prywatności">
          <p>
            Możemy aktualizować niniejszą Politykę Prywatności. O istotnych zmianach
            poinformujemy Cię e-mailem lub powiadomieniem w aplikacji z co najmniej
            <strong> 14-dniowym</strong> wyprzedzeniem. Data ostatniej aktualizacji
            widoczna jest na górze dokumentu.
          </p>
          <p>
            Dalsze korzystanie z Serwisu po dacie wejścia zmian w życie oznacza ich akceptację.
          </p>
        </Section>

        {/* ─── 14 ─── */}
        <Section title="14. Kontakt w sprawach prywatności">
          <div className="glass rounded-xl p-4">
            <p className="font-semibold text-foreground">{APP}</p>
            <p className="text-primary mt-1">{CONTACT}</p>
            <p className="text-xs text-muted-foreground mt-2">
              W tytule e-maila wpisz "RODO" lub "Prywatność". Odpowiadamy w ciągu 72 godzin,
              a w przypadkach pilnych (naruszenie bezpieczeństwa) — natychmiast.
            </p>
            <div className="border-t border-border/40 mt-3 pt-3">
              <p className="text-xs text-muted-foreground">
                Organ nadzorczy: Prezes Urzędu Ochrony Danych Osobowych (PUODO)<br/>
                ul. Stawki 2, 00-193 Warszawa · kancelaria@uodo.gov.pl · uodo.gov.pl
              </p>
            </div>
          </div>
        </Section>

        <div className="glass rounded-2xl p-5 text-center border border-border/40">
          <p className="text-xs text-muted-foreground">
            © 2026 {APP} · {DOMAIN} · Wszelkie prawa zastrzeżone
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <button onClick={() => navigate('/terms')} className="text-xs text-primary underline">Regulamin</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

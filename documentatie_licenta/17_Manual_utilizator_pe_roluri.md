# Manual scurt pe roluri (poate forma Anexa C sau un capitol separat)

## Pentru administratorul de companie

1. **Autentificare** – accesați adresa aplicației, introduceți e-mailul și parola furnizate sau creați cont dacă organizația tocmai pornește proiectul pilot.
2. **Crearea companiei** – din ecranul fără companie, completați denumirea și, opțional, domeniul afișat. Veți primi drepturi de administrator și un cod de alăturare pe care îl puteți distribui colegilor.
3. **Invitații** – în secțiunea de utilizatori, adăugați adrese de e-mail și roluri. Persoanele invitate vor finaliza înrolarea prin link sau prin înregistrare cu cod.
4. **Gestiunea flotei** – adăugați fiecare autovehicul cu numărul de înmatriculare, marca, kilometrajul curent și tipul de combustibil. Mențineți statusul la „în mentenanță” când vehiculul nu trebuie rezervat.
5. **Monitorizare** – consultați rezervările active, istoricul și jurnalul de audit pentru a identifica cine a modificat resurse critice.
6. **Aprobări** – revizuiți solicitările legate de depășiri de kilometraj sau documente de permis respinse, conform politicii interne.

## Pentru utilizatorul obișnuit

1. **Alăturare** – folosiți codul primit de la administrator sau finalizați invitația din e-mail.
2. **Permis** – încărcați o fotografie clară a permisului dacă politica companiei o cere; urmăriți statusul până la aprobare.
3. **Rezervare** – deschideți lista de autovehicule disponibile, selectați intervalul sau rezervarea imediată și confirmați. Notați codurile afișate pentru preluare dacă procedura internă le folosește.
4. **Modificări** – anulați sau prelungiți doar în limitele permise; la returnare introduceți kilometrajul real.
5. **Notificări** – activați notificările browserului sau folosiți aplicația mobilă pentru mementouri.

## Pentru suport IT intern

- Păstrați fișierul `.env` în afara controlului versiuni.
- Rulați migrările înainte de pornirea unei noi versiuni a codului.
- Salvați periodic baza PostgreSQL conform politicii organizației.
- Documentați orice modificare a URL-ului public sau a certificatului TLS.

---

## Secțiune extinsă: fluxul unei zile operaționale (narațiune)

Dimineața, administratorul verifică în dashboard dacă există vehicule marcate în mentenanță după service-ul din weekend. Un utilizator planifică o deplasare interurbană: deschide aplicația, constată două mașini diesel disponibile, alege una cu consum mediu favorabil și rezervă intervalul 09:00–17:00. Sistemul blochează suprapunerea cu o altă rezervare confirmată anterior.

La prânz, un alt angajat încearcă să rezerve aceeași mașină pentru același interval și primește mesaj de conflict. Administratorul observă în istoric tendința de supra-aglomerare a unei singure mașini și decide să aducă în flotă un vehicul suplimentar, operațiune reflectată imediat în listă.

Seara, la returnare, utilizatorul introduce kilometrajul; dacă depășește plafonul implicit al companiei, poate fi solicitat un motiv, iar administratorul primește o intrare în coada de aprobări. Acest scenariu, deși simplificat, ilustrează modul în care datele străbat straturile aplicației și justifică prezența entităților `Reservation`, `Car` și `AuditLog` în model.

---

## Întrebări frecvente (FAQ) – extensie pentru pagini suplimentare

**Î: Pot folosi același cont pe telefon și pe laptop?**  
R: Da, sesiunile web și mobil sunt tratate pe canale diferite; politica exactă depinde de configurarea serverului descrisă în capitolul de securitate.

**Î: De ce am fost deconectat fără să închid browserul?**  
R: Probabil v-ați autentificat din alt tab sau alt dispozitiv cu același canal web, ceea ce invalidează sesiunea veche.

**Î: Cum export rapoarte?**  
R: Funcțiile de export PDF (unde sunt implementate) folosesc biblioteci dedicate; detaliile tehnice se regăsesc în codul componentelor administrative.

Aceste subsecțiuni pot fi copiate integral în documentul Word și formatate cu spațiere 1,5 și font 12 pt Times New Roman (sau conform ghidului facultății) pentru a contribui la numărul total de pagini.

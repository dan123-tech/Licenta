# LUCRARE DE LICENTA – VARIANTA COMPLETA (asamblata conform sablonului din 00_STRUCTURA_SABLON_LUCRARE.md)

---

# PARTEA I – ELEMENTE PRETEXTUALE

*(Numerotare recomandată în documentul final Word: i, ii, iii… Paginație separată față de corpul lucrării, conform regulamentului facultății.)*

---

## Copertă și pagină de titlu (completare în Word)

| Câmp | Valoare |
|------|---------|
| **Universitatea** | `[completați]` |
| **Facultatea** | `[completați]` |
| **Programul de studii** | `[completați]` |
| **Titlul lucrării** | Sistem informatic pentru gestionarea flotei auto partajate la nivel de companie |
| **Tip lucrare** | Lucrare de licență |
| **Student** | `[nume și prenume]` |
| **Coordonator științific** | `[titlu academic, nume și prenume]` |
| **Locul și anul** | `[oraș], 2026` |

---

## Declarație pe proprie răspundere

Subsemnatul / Subsemnata **\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**, student(ă) la programul **\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**, declar pe proprie răspundere că prezenta lucrare de licență reprezintă rezultatul propriului demers intelectual, că nu conține porțiuni plagiate, iar sursele bibliografice și informațiile preluate au fost folosite conform normelor de citare ale instituției.

Date despre suportul electronic sau depunerea în platforma facultății se completează conform instrucțiunilor oficiale.

Data: **\_\_\_\_\_\_\_\_\_\_**  Semnătura: **\_\_\_\_\_\_\_\_\_\_**

---

## Cuprins

*Generați cuprinsul automat în Microsoft Word: Referințe → Cuprins → Cuprins automat (după ce ați aplicat stilurile Titlu 1, Titlu 2 pe fiecare capitol).*

---

## Lista figurilor

*(Opțional. Completați după inserarea diagramelor și capturilor de ecran.)*

| Nr. | Denumire figură | Pag. |
|-----|-----------------|------|
| 1 | `[ex.: Diagrama de arhitectură generală]` | |
| 2 | `[ex.: Schema bazei de date (ER)]` | |
| … | | |

---

## Lista tabelelor

*(Opțional.)*

| Nr. | Denumire tabel | Pag. |
|-----|----------------|------|
| 1 | `[ex.: Enumerarea tehnologiilor]` | |
| … | | |

---

*Continuare: urmează Rezumatul, Abstract-ul și corpul lucrării în fișierul `LUCRARE_COMPLETA_CONFORM_SABLON.md`.*



---


# Copertă, rezumat și abstract – câmpuri de completat

> **Instrucțiune:** Copiați conținutul de mai jos în documentul Word principal al lucrării. Înlocuiți textele marcate cu `[...]`.

---

## Date pentru copertă / pagină de titlu

- **Universitatea:** `[numele instituției]`
- **Facultatea:** `[...]`
- **Programul de studii:** `[...]`
- **Titlul lucrării:** *Sistem informatic pentru gestionarea flotei auto partajate la nivel de companie*
- **Tip lucrare:** Lucrare de licență / Proiect de diplomă `[bifați corect]`
- **Student:** `[nume prenume]`
- **Coordonator științific:** `[titlu, nume prenume]`
- **An universitar:** `[ex.: 2025–2026]`

---

## Rezumat (RO) – model de completat (200–300 cuvinte)

Lucrarea prezintă proiectarea și implementarea unei aplicații web și a unui client mobil asociat, destinate gestionării închiriării interne a autovehiculelor unei organizații. Scopul este digitalizarea fluxurilor prin care administratorii definesc parcul auto, invită angajații în cadrul companiei, iar utilizatorii rezervă vehicule, urmăresc istoricul și respectă reguli de aprobare (ex.: permis de conducere, limite de kilometraj).

Soluția tehnică adoptată combină un monolit **Next.js** (interfață React și rute API pe același proiect), o bază de date **PostgreSQL** accesată prin **Prisma**, precum și o aplicație **Android** care consumă aceleași endpoint-uri REST. Autentificarea se bazează pe sesiuni semnate în cookie, cu mecanisme suplimentare pentru separarea sesiunilor web față de cele mobile și pentru limitarea sesiunilor concurente per canal.

Au fost modelate entități precum utilizator, companie, apartenență la companie cu roluri, autovehicule, rezervări și jurnal de audit. Sistemul include funcții administrative (invitații, gestiune flotă, rapoarte) și funcții pentru utilizatorul obișnuit (rezervări, calendar, notificări). Documentația de față descrie arhitectura, baza de date, API-ul, interfețele și considerentele de securitate.

**Cuvinte-cheie:** flotă auto, partajare resurse, Next.js, PostgreSQL, Prisma, Android, REST, sesiune, multi-tenant.

---

## Abstract (EN) – model

This thesis presents the design and implementation of a web application and a companion mobile client for managing internal car sharing within an organization. The goal is to digitize workflows in which administrators maintain a vehicle fleet, invite employees into a company workspace, and end users reserve cars while following business rules such as driving licence checks and mileage limits.

The technical stack combines a **Next.js** monolith (React UI and API route handlers), a **PostgreSQL** database accessed through **Prisma**, and an **Android** app consuming the same REST API. Authentication relies on signed session cookies, with additional logic to distinguish web and mobile sessions and to restrict concurrent sessions per channel.

Core entities include users, companies, memberships with roles, vehicles, reservations, and audit logs. Administrative features cover invitations, fleet management, and reporting, while standard users access reservations, calendars, and notifications. This document describes system architecture, database design, APIs, user interfaces, and security considerations.

**Keywords:** fleet management, resource sharing, Next.js, PostgreSQL, Prisma, Android, REST, session, multi-tenant.



---


# Introducere

## Context și motivație

Organizațiile medii și mari care pun la dispoziția angajaților autovehicule pentru deplasări de serviciu se confruntă adesea cu lipsa unui instrument unic care să înlocuiască foi de calcul, mesagerie informală sau rezervări „la cuvânt”. Consecințele includ suprapunerea programărilor, dificultatea urmăririi responsabilului pentru o anumită perioadă și costuri mai mari de exploatare atunci când nu există o imagine clară asupra utilizării parcului.

Un sistem informatic dedicat permite standardizarea regulilor: cine poate rezerva, în ce condiții, cum se validează documentele (de exemplu permisul de conducere), cum se înregistrează predarea și returnarea vehiculului și cum pot administratorii interveni în caz de anomalii (depășire kilometraj, întârzieri, mentenanță).

Lucrarea de față pornește de la această nevoie practică și propune o soluție integrată, cu accent pe claritatea rolurilor (administrator versus utilizator obișnuit), pe trasabilitate (istoric rezervări, jurnal de acțiuni) și pe accesibilitate atât din browser, cât și de pe dispozitive mobile.

## Obiective

Obiectivele principale ale proiectului pot fi formulate astfel:

1. **Modelarea domeniului** – identificarea entităților relevante (utilizator, companie, membru, autovehicul, rezervare, invitație) și a relațiilor dintre ele, astfel încât datele să rămână coerente chiar și atunci când organizația are zeci de utilizatori și mai multe vehicule active simultan.

2. **Implementarea unui backend REST** – expunerea operațiunilor prin API-uri JSON, cu validare a intrărilor, separare între straturi (rută HTTP, logică de domeniu, acces la date) și posibilitatea documentării contractului API (OpenAPI / Swagger).

3. **Construirea unei interfețe web moderne** – panouri distincte pentru administrator și utilizator, cu componente reutilizabile, feedback vizual la erori și fluxuri ghidate (înscriere în companie, creare rezervare, aprobări).

4. **Oferirea unui client mobil** – pentru scenarii în care utilizatorul verifică disponibilitatea sau primește mementouri legate de rezervări fără a deschide laptopul.

5. **Tratarea securității la un nivel adecvat unui mediu academic îmbunătățit spre producție** – parole stocate prin funcții hash sensibile la timp, cookie-uri HTTP-only pentru sesiune, diferențiere între canalele web și mobil, mecanisme care împiedică menținerea simultană a mai multor sesiuni web valide pentru același cont acolo unde politica de securitate o cere.

## Contribuții și limitări

Contribuția lucrării constă în integrarea acestor obiective într-un singur depozit de cod, cu migrări versionate ale schemei bazei de date, scripturi de dezvoltare și suport pentru containerizare (Docker), ceea ce facilitează reproducerea mediului pe alt calculator sau pe un server de test.

Limitările sunt și ele menționate explicit: soluția nu înlocuiește un ERP complet; trimiterea e-mailurilor de invitație poate depinde de configurarea unui server SMTP extern; integrările cu surse de date externe (dacă sunt activate) presupun credențiale și politici de rețea corespunzătoare. Aceste aspecte sunt detaliate în capitolele finale.

## Structura documentului

Documentația urmează filiera logică a proiectării software: după introducere sunt prezentate fundamentele tehnologice, analiza cerințelor, arhitectura, modelul persistenței, detaliile serverului și API-ului, interfața web, aplicația mobilă, securitatea și testarea. Concluziile sintetizează rezultatele și propun direcții de extindere.



---


# Capitolul 1. Fundamente teoretice și tehnologii utilizate

## 1.1. Arhitecturi pentru aplicații web moderne

Dezvoltarea aplicațiilor web a evoluat de la pagini generate integral pe server către modele hibride în care o parte din logică rulează în browser (JavaScript), iar serverul furnizează fie fragmente de HTML, fie date structurate (JSON). Pentru aplicațiile orientate spre productivitate și timp scurt de livrare, **monolitul aplicativ** – un singur proiect care găzduiește atât interfața, cât și punctele de intrare API – rămâne o alegere frecventă la scară mică și medie, cu posibilitatea ulterioară de extragere a serviciilor critice.

**Next.js**, framework-ul folosit în proiect, se bazează pe **React** pentru construirea interfeței și introduce convenții pentru rutare bazată pe sistemul de fișiere, componente server și rute API implementate ca *route handlers*. Avantajul pentru licență constă în învățarea unui singur ecosistem (Node.js, module ECMAScript, instrumente de build) și în posibilitatea de a descrie clar separarea între codul care rulează exclusiv pe server și cel care ajunge în bundlul client.

## 1.2. Persistență relațională și ORM

**PostgreSQL** este un sistem de gestiune a bazelor de date relaționale robust, cu suport pentru tipuri avansate, constrângeri declarative și tranzacții ACID. Pentru o aplicație în care rezervările trebuie să respecte integritatea referențială (un autovehicul aparține unei singure companii, un utilizator este legat de companie printr-o entitate de legătură), modelul relațional este natural.

**Prisma** acționează ca strat de mapare obiect-relațional: schema este declarată într-un fișier central, iar migrările generează scripturi SQL versionate. Beneficiile includ tipizare la nivel de client generat, reducerea erorilor de sintaxă în interogări și documentarea implicită a modelului prin structura `schema.prisma`.

## 1.3. API-uri REST și contracte

Stilul **REST** presupune resurse adresabile prin verbe HTTP (GET pentru citire, POST pentru creare, PATCH pentru actualizări parțiale, DELETE pentru ștergere) și reprezentări în JSON. Un contract clar (de exemplu prin **OpenAPI 3.0**) permite echipei front-end și echipei mobile să lucreze în paralel și facilitează testarea automată. În proiect, specificația poate fi expusă printr-o rută dedicată și vizualizată cu **Swagger UI**.

## 1.4. Securitatea sesiunilor și a parolelor

Parolele nu trebuie stocate în clar. Algoritmi precum **bcrypt** (sau biblioteci compatibile) aplică o funcție unidirecțională lentă intenționat, reducând utilitatea atacurilor prin dicționar. Sesiunile bazate pe **cookie** pot fi protejate cu flag-ul `HttpOnly` pentru a limita accesul din scripturile de pe pagini potențial compromise, și cu atribute `SameSite` / `Secure` adaptate mediului (dezvoltare versus producție HTTPS).

Separarea sesiunilor pe canale (ex.: browser versus aplicație nativă) este o extensie a politicii de securitate: același utilizator poate rămâne autentificat pe telefon și pe laptop, dar o politică strictă poate limita numărul de sesiuni active per canal, invalidând identificatorii vechi în baza de date.

## 1.5. Platforma Android și consumul API

Aplicațiile **Android** tradiționale comunică cu serverul prin biblioteci HTTP (de exemplu **Retrofit** peste **OkHttp**). Gestionarea cookie-urilor de sesiune pe client necesită un **CookieJar** sau echivalent, astfel încât cererile ulterioare să includă automat antetul `Cookie`. Pe lângă REST, notificările pot folosi **Firebase Cloud Messaging** pentru mesaje push, cu condiția înregistrării unui token pe server.

## 1.6. Sumar al alegerilor din proiect

| Strat | Tehnologie principală | Rol |
|--------|---------------------|-----|
| UI web | React 19, Next.js 16 | Pagini, componente client, rutare |
| API | Route handlers Next.js | Endpoint-uri JSON |
| Date | PostgreSQL + Prisma | Persistență și migrări |
| Auth | Cookie semnat, bcrypt | Autentificare și autorizare |
| Mobile | Android (Java), Retrofit | Client dedicat |
| Documentație API | OpenAPI / Swagger UI | Contract și explorare |

Aceste alegeri sunt reluate critic în capitolul de arhitectură, unde sunt mapate pe modulele concrete ale depozitului de cod.



---


# Capitolul 2. Analiza domeniului și a cerințelor

## 2.1. Actori și roluri

În sistemul propus se disting următoarele categorii de actori:

- **Vizitator neautentificat** – poate accesa pagini publice (autentificare, înregistrare) și, după caz, fluxul de stabilire a parolei pornind de la un link de invitație.
- **Utilizator autentificat fără companie** – cont valid, dar neasociat încă unei organizații; poate crea o companie nouă sau introduce un cod de alăturare.
- **Membru utilizator (USER)** – aparține unei companii, poate vizualiza autovehiculele disponibile, crea și gestiona rezervările proprii în limitele politicii companiei.
- **Membru administrator (ADMIN)** – are drepturi extinse: invită utilizatori, modifică roluri, gestionează parcul auto, consultă istoricul și jurnalul de audit, validează sau respinge anumite solicitări (ex.: depășiri de kilometraj documentate).

Rolurile sunt modelate ca enumerări la nivel de bază de date și verificate în fiecare rută API sensibilă.

## 2.2. Cerințe funcționale principale

**Autentificare și înrolare.** Sistemul trebuie să permită crearea unui cont cu e-mail și parolă, autentificarea prin credențiale și delogarea sigură. Alăturarea la o companie se poate face fie prin cod unic de join, fie prin invitație cu token, urmată de setarea parolei.

**Gestiunea companiei.** Administratorul poate actualiza date de profil ale companiei (denumire, domeniu afișat, parametri de cost combustibil / consum implicit, cod de join). Utilizatorii văd informațiile relevante rolului lor.

**Gestiunea flotei.** Autovehiculele au atribute tehnice și administrative: marcă, model, număr de înmatriculare, kilometraj, stare operațională (disponibil, rezervat, în mentenanță), tip de combustibil sau propulsie, consum mediu, baterie (pentru vehicule electrice), date despre ultimul service. Administratorul poate adăuga, modifica sau șterge înregistrări.

**Rezervări.** Utilizatorul inițiază o rezervare asociind un vehicul, un scop (opțional) și un interval temporal sau o rezervare „instant” până la eliberare. Sistemul trebuie să prevină conflictele inacceptabile (același vehicul în același interval, conform regulilor implementate). Sunt prevăzute acțiuni de anulare, prelungire și eliberare, cu înregistrarea kilometrajului la returnare.

**Permis de conducere.** Utilizatorul poate încărca o imagine a permisului; statusul poate fi în așteptare, aprobat sau respins, cu verificare automată (unde este configurată) sau manuală de către administrator.

**Notificări și mementouri.** În mediul web pot exista componente care interoghează periodic serverul; pe mobil pot fi programate alarme locale și notificări push pentru apropierea momentului de început al rezervării sau pentru coduri de preluare.

**Audit.** Acțiunile administrative relevante pot fi înregistrate într-un jurnal pentru conformitate internă și depanare.

## 2.3. Cerințe nefuncționale

**Performanță.** Timpul de răspuns acceptabil pentru operațiuni uzuale (listări, filtre) în mediul de învățare este sub secunde, cu mențiunea că volumele mari de date impun indexare adecvată.

**Securitate.** Parole hash, cookie sesiune, validare Zod (sau similar) pe corpul cererilor, verificarea apartenenței la companie înainte de a returna resurse tenant-scoped.

**Disponibilitate și portabilitate.** Proiectul include fișiere Docker și variabile de mediu pentru a rula aplicația și baza de date pe mașini diferite.

**Usabilitate.** Interfața urmărește un design consistent (culori, spacing, feedback la erori), cu moduri distincte pentru administrator și utilizator.

## 2.4. Cazuri de utilizare rezumate (textual)

1. *Administrator invită un nou angajat* → se creează înregistrare de invitație și membru în stare pendinte; utilizatorul finalizează contul.
2. *Utilizator rezervă o mașină pentru mâine* → se verifică disponibilitatea, se creează rezervarea, statusul vehiculului poate fi actualizat automat.
3. *Administrator aprobă o depășire de kilometraj motivată* → se închide un flux de aprobare legat de rezervare.
4. *Utilizator primește memento înainte de începerea rezervării* → canal web sau mobil, în funcție de configurare.

Aceste scenarii sunt mapate în capitolele de implementare la rute și componente concrete.

## 2.5. Constrângeri și dependențe externe

Sistemul depinde de disponibilitatea PostgreSQL și a unui secret de semnare a sesiunii (`AUTH_SECRET`) suficient de lung. Funcționalități opționale (e-mail, Firebase, surse de date externe) necesită chei și servicii suplimentare, documentate în fișierele de exemplu `.env.example` din proiect.



---


# Capitolul 3. Arhitectura sistemului

## 3.1. Vedere generală

Aplicația **Company Car Sharing** (interfață comercială denumită în proiect **FleetAdmin**) urmează modelul **monolit modular**: codul sursă se află într-un singur depozit, dar responsabilitățile sunt separate pe directoare pentru a limita cuplarea.

Fluxul tipic este următorul: clientul (browser sau aplicație Android) trimite cereri HTTP către serverul Next.js; route handlers validează sesiunea și rolul, apelează funcții din straturi `lib/` care encapsulează Prisma și regulile de domeniu; răspunsul este JSON (sau fișier binar pentru încărcări). Paginile React consumă aceleași rute prin `fetch` cu `credentials: 'include'`.

## 3.2. Structura directoarelor (perspectivă logică)

- **`src/app/`** – definit App Router: pagini (`login`, `register`, `dashboard`), layout-uri și **`api/`** cu subfoldere pe domeniu (`auth`, `companies`, `cars`, `reservations`, `users`, etc.).
- **`src/lib/`** – logică reutilizabilă: `db` (client Prisma singleton), `auth` (sesiune, tokenuri pe canal), `companies`, `users`, `api-helpers` (răspunsuri JSON, `requireSession`, `requireCompany`, `requireAdmin`).
- **`src/components/`** – componente React grupate pe zone (ex.: `dashboard/`).
- **`prisma/`** – `schema.prisma` și migrările SQL generate.
- **`android/`** – proiect Gradle cu activități, fragmente, repository-uri și client Retrofit.

Această organizare permite ca o modificare în schema bazei de date să fie urmată de actualizarea migrării și a tipurilor generate, fără a dispersa interogări SQL ad-hoc în toate fișierele.

## 3.3. Fluxul autentificării (conceptual)

1. Utilizatorul trimite credențiale la `POST /api/auth/login`.
2. Serverul verifică hash-ul parolei și încarcă apartenența la companie (dacă există).
3. Se rotește un identificator de sesiune stocat în baza de date pe canal (`web` sau `mobile`) și se emite un cookie semnat care conține date de identificare și referința la sesiune.
4. Cererile ulterioare trimit cookie-ul; pe web, un antet suplimentar legat de `sessionStorage` poate fi folosit pentru a distinge file de browser care împart același cookie.

Detaliile complete se găsesc în capitolul dedicat securității.

## 3.4. Multi-tenancy la nivel de companie

Toate resursele critice (mașini, rezervări, invitații) sunt legate de `companyId`. Verificarea `requireCompany` asigură că utilizatorul autentificat are o companie activă înainte de a accesa aceste resurse. Administratorii sunt identificați prin rol în `CompanyMember` și prin funcții auxiliare care confirmă drepturile pentru compania curentă.

## 3.5. Integrări opționale

Proiectul prevede câmpuri JSON pentru **configurarea sursei de date** și **credențiale criptate** la nivel de companie, permițând conectarea unor straturi (utilizatori, mașini, rezervări) la furnizori externi (ex.: SQL Server, Firebase). Aceste mecanisme sunt extensii: nucleul rămâne PostgreSQL.

## 3.6. Proxy de dezvoltare

Pentru testarea de pe telefon în rețea locală, un mic server Node (`proxy-3001.js`) poate redirecționa traficul către portul aplicației Next, simplificând accesul la adresa IP a stației de lucru. Portul proxy poate fi reconfigurat prin variabilă de mediu dacă apar conflicte (ex.: alt serviciu pe 3001).

## 3.7. Diagramă recomandată pentru inserare în lucrare

Se recomandă inserarea unei **diagrame de componente** (de exemplu în draw.io) cu: Client web, Client Android, Server Next.js, PostgreSQL, opțional Docker, opțional FCM. Legăturile se etichetează cu protocolul (HTTPS/HTTP, SQL).



---


# Capitolul 4. Proiectarea bazei de date

## 4.1. Model conceptual

Baza de date urmărește principiul normalizării pentru entitățile centrale: utilizatorii sunt entități globale (un e-mail unic în sistem), iar apartenența la o organizație se exprimă printr-o tabelă de legătură `CompanyMember` care poartă atât rolul, cât și starea de înrolare (activ sau în așteptare după invitație).

Autovehiculul este întotdeauna subordonat unei singure companii. Rezervarea leagă un utilizator de un autovehicul și stochează intervalul temporal, scopul, coduri operaționale (preluare / eliberare), kilometraj raportat la returnare, precum și câmpuri pentru fluxuri de aprobare când utilizarea depășește limitele stabilite.

## 4.2. Enumerări

Schema Prisma definește enumerări explicite, ceea ce îmbunătățește lizibilitatea și previne valori ad-hoc:

- **Role:** `ADMIN`, `USER`
- **MemberStatus:** `ENROLLED`, `PENDING_INVITE`
- **CarStatus:** `AVAILABLE`, `RESERVED`, `IN_MAINTENANCE`
- **ReservationStatus:** `ACTIVE`, `COMPLETED`, `CANCELLED`
- **DrivingLicenceStatus:** `PENDING`, `APPROVED`, `REJECTED`
- **ExceededApprovalStatus:** `PENDING_APPROVAL`, `APPROVED`, `REJECTED`
- **FuelType:** `Benzine`, `Diesel`, `Electric`, `Hybrid`

Aceste tipuri sunt transpuse în tipuri SQL corespunzătoare la migrare.

## 4.3. Entitatea User

Pe lângă câmpurile de profil, modelul include atribute pentru permis (URL imagine, status, sursa verificării), token FCM pentru notificări mobile și **două câmpuri opționale pentru sesiune activă pe canal** (`activeWebSessionToken`, `activeMobileSessionToken`). Acestea permit invalidarea selectivă a sesiunilor la o nouă autentificare pe același canal, fără a deconecta automat celălalt canal.

## 4.4. Entitatea Company

Include parametri economici utili rapoartelor (prețuri pe tip de combustibil, consum implicit, tarif energie electrică per kWh), un cod de join opțional unic și câmpuri JSON pentru configurarea sursei externe de date și stocarea credentialelor cifrate. Separarea configurației de credențiale reduce riscul expunerii accidentale în loguri.

## 4.5. Rezervări și jurnal

Tabela `Reservation` agregă informațiile necesare ciclului de viață al unei închirieri interne. Câmpurile pentru mementouri push (`pushReminderBeforeStartSentAt`, etc.) permit evitarea trimiterilor duplicate către dispozitive.

`AuditLog` înregistrează acțiuni semnificative (tip entitate, identificator, meta JSON), cu legătură la companie și actor.

## 4.6. Indexare și integritate

Indexul pe `User.email` accelerează autentificarea. Constrângerile de cheie străină asigură că o rezervare nu poate indica un autovehicul inexistent. Migrările din folderul `prisma/migrations` constituie istoricul evoluției schemei și trebuie menționate în lucrare ca dovadă a disciplinei de versionare.

## 4.7. Tabel sintetic (pentru documentul Word)

| Entitate | Cheie primară | Rol principal |
|---------|---------------|---------------|
| User | id (CUID) | Cont și profil |
| Company | id | Tenant organizațional |
| CompanyMember | id | Rol + stare în companie |
| Invite | id | Token invitație |
| Car | id | Flotă |
| Reservation | id | Închirieri |
| AuditLog | id | Trasabilitate |

Figura poate fi transformată în tabel formatat în Word pentru a ocupa pagini suplimentare în varianta tipărită.



---


# Capitolul 5. Implementarea serverului și a API-ului REST

## 5.1. Route handlers și validare

Endpoint-urile sunt implementate ca fișiere `route.js` în `src/app/api/...`. Intrările sunt validate preferabil cu **Zod**, returnând coduri HTTP semantice: `401` pentru neautorizat, `403` pentru lipsă drepturi, `422` pentru date invalide, `503` când un strat depinde de o sursă externă neconfigurată.

Helper-ele `jsonResponse` și `errorResponse` uniformizează structura JSON (`{ error: "mesaj" }` sau payload-uri de succes).

## 5.2. Autentificare

- **`POST /api/auth/login`** – acceptă `clientType` (`web` / `mobile`) pentru a decide canalul de sesiune; răspunsul pentru web poate include `webSessionId` pentru stocare în `sessionStorage`.
- **`POST /api/auth/register`** – înregistrare publică fără companie implicită.
- **`POST /api/auth/logout`** – șterge cookie-urile de sesiune și invalidează tokenul de canal dacă este cazul.
- **`GET /api/auth/session`** – întoarce utilizatorul curent, compania și, unde e relevant, identificatorul de sesiune web pentru sincronizarea clientului.
- **`POST /api/auth/set-password`** – finalizare cont din fluxul de invitație.

## 5.3. Companii

- **`POST /api/companies`** – creare companie (utilizator autentificat fără companie); utilizatorul devine administrator.
- **`POST /api/companies/join`** – alăturare prin cod.
- **`GET/PATCH /api/companies/current`** – citire și actualizare profil companie (porțiuni restricționate admin).

## 5.4. Utilizatori și invitații

- **`GET /api/users`** – listare membri cu filtre după stare.
- **`POST /api/users/invite`** – creare invitație (admin).
- **`PATCH /api/users/:id`** – modificare rol, status permis, etc.
- **`DELETE /api/users/:id`** – eliminare din companie (conform regulilor implementate).
- **`GET /api/invites`**, **`POST /api/users/invite`** – legate de administrarea invitațiilor active.

## 5.5. Autovehicule

- **`GET /api/cars`** – listare cu filtru opțional după status.
- **`POST /api/cars`** – creare (admin).
- **`GET/PATCH/DELETE /api/cars/:id`** – detaliu, actualizare, ștergere.

Logica poate include recalcularea automată a statusului vehiculului în funcție de rezervările active.

## 5.6. Rezervări

- **`GET /api/reservations`** – listă pentru compania curentă.
- **`POST /api/reservations`** – creare; suport pentru rezervare programată sau imediată, în funcție de câmpurile trimise.
- **`PATCH /api/reservations/:id`** – acțiuni: anulare, prelungire, eliberare, aprobări pentru depășiri, regenerare coduri.
- **`GET /api/reservations/history`**, **`GET /api/reservations/pending-approvals`** – rapoarte diferențiate pe rol.
- **`POST /api/reservations/verify-pickup-code`** – validare cod la preluare.

## 5.7. Fișiere și notificări

- **`POST/DELETE /api/users/me/driving-licence`** – încărcare fișier (FormData) și ștergere.
- **`POST /api/users/me/push-token`** – înregistrare token FCM.
- **`GET/POST /api/cron/reservation-push-reminders`** – rută destinată job-urilor planificate (mementouri).

## 5.8. Documentație OpenAPI

Ruta `src/app/api/openapi/route.js` generează specificația consumată de interfața Swagger la `/api-docs`. În lucrare se pot include capturi de ecran cu lista de endpoint-uri grupate pe tag-uri.

## 5.9. Observații de implementare

Separarea `requireSession`, `requireCompany` și `requireAdmin` reduce duplicarea verificărilor. Pentru straturi opționale (date externe), răspunsurile `503` cu cod `DATA_SOURCE_NOT_CONFIGURED` permit front-end-ului să afișeze mesaje explicite fără a trata eroarea ca o defecțiune generică.



---


# Capitolul 6. Interfața utilizator web

## 6.1. Pagini publice

**Autentificare (`/login`)** – formular e-mail/parolă, integrare cu `apiLogin`, redirecționare către dashboard după succes. Stilizare cu variabile CSS pentru temă consistentă (fundal principal, accent primar).

**Înregistrare (`/register`)** – colectare nume, e-mail, parolă; validări minime reflectate și pe server.

## 6.2. Dashboard-ul principal

Pagina `/dashboard` este o componentă client care:

1. Încarcă sesiunea prin `apiSession`.
2. Afișează un ecran de încărcare până la primirea datelor.
3. Ramifică interfața în trei direcții: utilizator fără companie (componentă `NoCompanyView` – creare sau join), utilizator standard (`UserDashboard`), administrator (`AdminDashboard` sau comutare vizualizare ca utilizator).

## 6.3. Componente de siguranță a sesiunii

**`WebSessionLiveGuard`** – monitorizează în fundal sesiunea: ascultă evenimente de tip BroadcastChannel când alt tab se autentifică, reacționează la evenimente globale declanșate la răspunsuri `401` și poate interoga periodic endpoint-ul de sesiune. Navigarea spre pagina de login se face cu `router.replace`, evitând reîncărcarea completă a documentului.

**`InAppNotificationPoller`** – interogări periodice pentru schimbări legate de permis și rezervări, cu notificări în aplicație și opțional prin API-ul browserului *Notification*.

## 6.4. Module administrative (rezumat)

- Gestiune utilizatori: tabel cu filtre, invitații, modificare roluri.
- Gestiune flotă: CRUD autovehicule, status, atribute tehnice.
- Rezervări și aprobări: liste pentru rezervări active, istoric, aprobare depășiri.
- Setări companie și (unde e cazul) configurare sursă de date și credențiale – secțiuni dedicate în componente precum `DatabaseSettingsSection`.
- Jurnal audit: `AuditLogsSection` cu paginare.

## 6.5. Module utilizator

- Vizualizare mașini disponibile / indisponibile cu filtre.
- Creare rezervare (dialog sau formular) cu validări de dată.
- Istoric personal, calendar (integrare **react-big-calendar** unde este folosită).
- Încărcare permis de conducere.

## 6.6. Biblioteci UI relevante

Proiectul folosește **lucide-react** pentru pictograme, **recharts** pentru grafice administrative, **jspdf** / **jspdf-autotable** pentru exporturi document, **qrcode.react** pentru generare coduri QR unde este cazul. Mențiunea acestora în lucrare arată conștientizarea ecosistemului frontend.

## 6.7. Capturi de ecran recomandate pentru licență

Minimum sugerat: login, dashboard utilizator, listă mașini, dialog rezervare, panou admin utilizatori, panou admin mașini, istoric rezervări, Swagger UI. Fiecare captură se numerotează și se referă din text („a se vedea Figura 3.2”).



---


# Capitolul 7. Aplicația mobilă Android

## 7.1. Scopul clientului nativ

Aplicația Android oferă acces la aceleași capabilități esențiale ca și varianta web, optimizate pentru ecran mic și pentru scenarii în deplasare: autentificare, vizualizare companie, listă autovehicule, rezervări, notificări. Comunicarea cu serverul respectă contractul REST al API-ului Next.js.

## 7.2. Organizare cod

Pachetul principal (`com.company.carsharing`) grupează:

- **modele** – clase Java mapate cu Gson pe JSON (`LoginRequest`, `LoginResponse`, etc.).
- **network** – `RetrofitClient`, `ApiService`, interceptori pentru cookie-uri de sesiune.
- **data** – preferințe securizate pentru stocarea utilizatorului și repository-uri (`AuthRepository`).
- **ui** – activități și fragmente pentru login, dashboard, companie, rezervări, calendar.

## 7.3. Autentificare și sesiune

`LoginRequest` include `clientType: "mobile"` pentru a direcționa rotația tokenului de sesiune pe canalul mobil, independent de sesiunea web. `SessionCookieInterceptor` atașează cookie-urile returnate de server la apelurile ulterioare, asigurând continuitatea sesiunii fără a expune manual tokenul în fiecare antet (în afara mecanismelor specifice web descrise anterior).

## 7.4. Funcționalități reprezentative

- Ecran de autentificare cu opțiune *remember me* (comportament definit în colaborare cu logica de repository).
- Fragmente pentru rezervări, calendar, statistici, permis de conducere, aprobări în așteptare (pentru administratori).
- Programare alarme locale și integrare FCM pentru mementouri legate de rezervări (în măsura în care serviciile Google sunt configurate pe proiect).

## 7.5. Construire și testare

Proiectul Gradle poate fi deschis în Android Studio. Pentru testare împotriva serverului de dezvoltare pe rețea locală, baza URL API se configurează (de exemplu IP-ul stației care rulează Next.js). Documentația din folderul `android/README.md` a depozitului poate fi citată ca sursă tehnică complementară.

## 7.6. Limitări

Versiunea mobilă depinde de disponibilitatea rețelei și de compatibilitatea dispozitivului cu serviciile Google pentru push. Anumite funcții administrative complexe pot fi mai confortabile pe interfața web extinsă.



---


# Capitolul 8. Securitate și politici de sesiune

## 8.1. Parole și secret de semnare

Parolele sunt persistate exclusiv sub formă de hash realizat cu **bcryptjs** (sare și cost configurabile în modulul de autentificare). Variabila `AUTH_SECRET` trebuie să aibă lungime minimă impusă de codul aplicației pentru semnarea cookie-ului; absența sau slăbiciunea secretului oprește pornirea funcțiilor critice.

## 8.2. Cookie de sesiune

Payload-ul cookie-ului include identificatorul utilizatorului, date de profil relevante pentru UI, apartenența la companie, rolul, canalul (`web` / `mobile`) și identificatorul de sesiune (`sid`). Semnătura este calculată cu o funcție derivată din secret pentru a limita falsificarea locală a conținutului.

În producție pe HTTPS se pot folosi prefixe `__Host-` și flag-ul `Secure`; în dezvoltare pe HTTP se utilizează un nume legacy al cookie-ului și `SameSite=lax` pentru a permite fluxuri locale.

## 8.3. Validare în baza de date

La fiecare cerere autentificată, identificatorul de sesiune trebuie să coincidă cu valoarea stocată în tabela `User` pentru canalul respectiv (`activeWebSessionToken` sau `activeMobileSessionToken`). O nouă autentificare pe același canal suprascrie tokenul, invalidând sesiunile anterioare pe acel canal.

## 8.4. Diferențierea taburilor de browser (canal web)

Cookie-ul este partajat între toate filele aceluiași origini; de aceea, pentru web, clientul trimite un antet suplimentar (`X-Web-Session-Id`) legat de `sessionStorage`, care este izolat per filă. Astfel, o filă rămasă cu un identificator vechi nu mai trece validarea chiar dacă cookie-ul a fost actualizat de o altă filă.

Evenimente **BroadcastChannel** și interceptarea globală a răspunsurilor `401` îmbunătățesc reacția imediată a interfeței fără a necesita reîmprospătarea manuală a paginii.

## 8.5. Autorizare pe roluri

Funcțiile `requireCompany` și `requireAdmin` împiedică escaladarea accidentală: un utilizator obișnuit nu poate invoca operațiuni rezervate administratorilor. Verificările se bazează pe înregistrarea `CompanyMember` și pe interogări suplimentare unde este necesar.

## 8.6. Date sensibile și surse externe

Credențialele pentru surse externe sunt stocate cifrat (modulul de criptare folosește derivarea unei chei din `AUTH_SECRET`). Orice expunere accidentală în loguri trebuie evitată prin discipline de cod review.

## 8.7. Recomandări pentru mediul de producție

- HTTPS obligatoriu, HSTS unde este compatibil cu infrastructura.
- Rotire periodică a secretelor și a cheilor de criptare, cu plan de migraune a datelor cifrate vechi.
- Limitare rată la nivel de proxy pentru rutele de autentificare.
- Monitorizare jurnal audit pentru acțiuni critice.



---


# Capitolul 9. Testare, rulare locală și deployment

## 9.1. Mediu de dezvoltare

Pașii tipici pentru un dezvoltator care clonează depozitul:

1. Instalare dependențe Node (`npm install`), care declanșează `prisma generate` prin scriptul `postinstall`.
2. Configurare fișier `.env` cu `DATABASE_URL` și `AUTH_SECRET` (și alte variabile opționale).
3. Aplicare migrări: `npx prisma migrate deploy` sau `migrate dev` în cursul dezvoltării.
4. Pornire server: `npm run dev` (Next pe portul 3000 și proxy opțional pe 3010/3001 după configurare).

## 9.2. Testare funcțională manuală

Se recomandă o **listă de verificare** documentată în anexă:

- Înregistrare utilizator nou → autentificare → creare companie.
- Generare cod join → al doilea utilizator se alătură.
- Administrator invită e-mail → flux set-password (unde este configurat).
- CRUD autovehicul → schimbare status.
- Creare rezervare → anulare / prelungire / eliberare cu kilometraj.
- Verificare comportament sesiune pe două file de browser.
- Rulare aplicație Android împotriva aceluiași API.

## 9.3. Testare automată

Proiectul poate fi extins cu teste unitare (ex.: Vitest / Jest) pentru utilitarele pure și teste de integrare pentru rute API cu bază de date de test. În lucrarea de licență se poate descrie **strategia** chiar dacă acoperirea actuală este parțială.

## 9.4. Build producție

`npm run build` compilează aplicația Next.js. `npm run start` pornește serverul de producție. Erorile de tip secret lipsă sau client Prisma neactualizat trebuie documentate ca probleme întâlnite în timpul dezvoltării și soluțiile aplicate (regenerare client, oprire procese care blochează DLL-uri pe Windows).

## 9.5. Docker

Fișierele `docker-compose.yml` (și variantele `docker-compose.dev.yml` dacă există) permit orchestrarea aplicației și a PostgreSQL. În capitol se poate include un fragment de diagramă de deployment: container aplicație, container bază, volume pentru date persistente.

## 9.6. Observabilitate

Logurile Prisma pot fi activate în dezvoltare pentru a urmări interogările SQL. În producție se recomandă reducerea verbozității și externalizarea logurilor structurate.



---


# Capitolul 10. Perspective asupra interfeței și gestionării erorilor

> *Acest capitol suplimentar întărește volumul documentației și detaliază aspecte ergonomice; poate fi renumerotat în cuprinsul final după preferința coordonatorului.*

## 10.1. Principii de design aplicabile

Interfața **FleetAdmin** urmărește lizibilitatea pe fundal deschis cu accente de culoare pentru acțiuni primare (butoane, link-uri). Spațierea generoasă între câmpuri reduce rata erorilor de atingere pe ecrane tactile. Mesajele de eroare evită expunerea detaliilor tehnice către utilizatorul final, păstrând în același timp suficient context pentru depanare în consola dezvoltatorului.

## 10.2. Stări de încărcare și feedback

Componentele care apelează API-ul afișează stări intermediare („Se încarcă…”, spinner) pentru a preveni dublarea trimiterilor de formulare. După succes, unele acțiuni închid modalele sau reîmprospătează listele prin callback-uri transmise între părinte și copil (ex.: `loadSession`, `onUserUpdated`).

## 10.3. Gestionarea erorilor de rețea

Pe mobil, mesajele explică faptul că serverul poate fi inaccesibil dacă adresa IP sau portul nu corespund rețelei curente. Pe web, erorile `503` cu cod `DATA_SOURCE_NOT_CONFIGURED` sunt tratate distinct, permițând administratorului să înțeleagă că stratul de date extern nu este conectat, nu că aplicația este oprită.

## 10.4. Accesibilitate (nivel de bază)

Contrastul text–fundal respectă orientări minime WCAG acolo unde variabilele CSS au fost alese conștient. În lucrări viitoare se pot adăuga etichete ARIA suplimentare și navigare completă de la tastatură pentru toate modulele administrative.

## 10.5. Internaționalizare

Interfața este în prezent predominant în limba engleză pentru etichete de produs; extinderea cu fișiere de traducere (ex.: `next-intl`) este o direcție naturală pentru organizații multinaționale.

## 10.6. Documentarea deciziilor de produs

Orice abatere față de cerințele iniiale din `CAR_PROJECT.txt` trebuie justificată în secțiunea de concluzii sau într-un registru de decizii (ADR) păstrat în depozit; acest obicei îmbunătățește urmărirea istoricului în echipe mari.



---


# Concluzii

Lucrarea a prezentat proiectarea și implementarea unui sistem integrat pentru gestionarea închirierilor interne ale autovehiculelor într-o organizație, cu interfață web și client Android. S-a pus accent pe modelarea clară a entităților, pe separarea responsabilităților în cadrul monolitului Next.js și pe politici de sesiune care reflectă preocupări reale de securitate (canale distincte, invalidare controlată, reacție rapidă la pierderea sesiunii în interfață).

Rezultatul obținut demonstrează că un stack modern (React, Next.js, Prisma, PostgreSQL) poate susține un flux complet de la invitație la raportare, fără a necesita, în faza curentă, microservicii separate. Extensiile privind surse externe de date și notificările push arată direcții de evoluție către integrări enterprise.

Limitările identificate includ dependența de configurarea manuală a mediului, necesitatea unor teste automate mai extinse și posibile îmbunătățiri UX pe dispozitive cu accesibilitate redusă. Ca dezvoltări viitoare se pot menționa: roluri intermediare, aprobări multi-nivel pentru rezervări, integrare calendar organizațional, rapoarte exportabile standardizate și durabilitate operațională (metrici, alarme).

Autorul consideră că obiectivele inițiale au fost atinse într-o formă verificabilă prin codul sursă și prin documentația API, iar experiența acumulată poate fi transferată către proiecte similare de digitalizare a proceselor interne.



---


# Bibliografie orientativă

> Completați strict cu sursele pe care le-ați consultat și la care faceți trimitere în text (conform stilului facultății: Harvard, IEEE, etc.). Lista de mai jos este **exemplificativă** — înlocuiți cu ediții și pagini exacte pe care le aveți la îndemână.

1. Vercel Inc. *Next.js Documentation* – documentație oficială framework (consultată online).
2. Meta Open Source. *React Documentation* – ghiduri și referință API.
3. Prisma Data, Inc. *Prisma Docs* – schema, migrări, client API.
4. PostgreSQL Global Development Group. *PostgreSQL Documentation* – manualul sistemului de gestiune a bazelor de date.
5. Fielding, R. T. *Architectural Styles and the Design of Network-based Software Architectures* – teza doctorală care introduc stilul REST (dacă este cerută sursă clasică).
6. OWASP Foundation. *OWASP Cheat Sheet Series* – sesiuni, cookie-uri, stocare parole (ghiduri de bune practici).
7. Google LLC. *Android Developers Documentation* – ghiduri platformă și recomandări securitate.
8. Square, Inc. (maintainer). *Retrofit* – documentație bibliotecă HTTP pentru Android.

**Notă:** Dacă folosiți cărți tipărite despre React sau PostgreSQL, înlocuiți intrările web cu: autor(i), titlu, editură, an, pagini.



---


# Anexa A. Scenarii detaliate de testare (checklist)

Această anexă poate fi copiată într-un tabel Word și bifată în timpul demonstrației sau al probei practice. Fiecare scenariu include pașii, datele de intrare așteptate și rezultatul așteptat.

## A.1. Cont și autentificare

| ID | Pași | Date de test | Rezultat așteptat |
|----|------|--------------|-------------------|
| T1 | Deschidere `/register`; completare formular valid | e-mail unic, parolă ≥ 8 caractere | Cont creat, mesaj de succes sau redirecționare conform fluxului |
| T2 | Autentificare cu credențiale corecte | același e-mail | Răspuns 200, cookie de sesiune setat, redirect dashboard |
| T3 | Autentificare cu parolă greșită | parolă incorectă | 401, mesaj generic de eroare, fără detalii despre existența contului |
| T4 | Delogare din interfață | buton logout | Cookie eliminat, acces API protejat returnează 401 |

## A.2. Companie și membri

| ID | Pași | Rezultat așteptat |
|----|------|-------------------|
| T5 | Utilizator fără companie creează organizație | Devine ADMIN, companie vizibilă în sesiune |
| T6 | Al doilea utilizator folosește cod join valid | Devine membru ENROLLED cu rol USER implicit |
| T7 | Administrator trimite invitație pe e-mail nou | Înregistrare Invite + membru PENDING_INVITE |
| T8 | Administrator promovează USER la ADMIN | Rol actualizat, drepturi extinse la următorul request |

## A.3. Flotă

| ID | Pași | Rezultat așteptat |
|----|------|-------------------|
| T9 | Adăugare vehicul cu toate câmpurile obligatorii | Înregistrare în listă, vizibilă pentru companie |
| T10 | Modificare status IN_MAINTENANCE | Filtrul „disponibile” exclude vehiculul |
| T11 | Ștergere vehicul fără rezervări active | 200 sau conform regulii de business |
| T12 | Încercare ștergere de către non-admin | 403 |

## A.4. Rezervări

| ID | Pași | Rezultat așteptat |
|----|------|-------------------|
| T13 | Creare rezervare în viitor pe vehicul disponibil | Rezervare creată, status vehicul actualizat dacă logica prevede |
| T14 | Anulare rezervare de către proprietar | Status CANCELLED sau echivalent |
| T15 | Prelungire termen | Data de sfârșit actualizată dacă nu există conflict |
| T16 | Eliberare cu kilometraj introdus | Închidere flux, valori persistate |

## A.5. Sesiuni și file multiple

| ID | Pași | Rezultat așteptat |
|----|------|-------------------|
| T17 | Autentificare filă A, apoi autentificare același user filă B | Filă A pierde sesiunea validă la următoarea acțiune sau prin mecanismul de notificare |
| T18 | Autentificare web + autentificare mobil același cont | Ambele rămân active simultan (canal diferit) |

## A.6. API și documentație

| ID | Pași | Rezultat așteptat |
|----|------|-------------------|
| T19 | Deschidere `/api-docs` | Interfață Swagger funcțională |
| T20 | Apel manual `GET /api/auth/session` fără cookie | 401 |

---

Text explicativ pentru lucrare (de adăugat în capitolul de testare): „Scenariile T1–T20 acoperă fluxurile critice identificate în analiza cerințelor. Pentru fiecare release, subsetul minim obligatoriu este T1, T2, T5, T9, T13, T17. Extinderea automată a suitei de teste rămâne ca recomandare de mentenanță.”



---


# Anexa B. Index orientativ al fișierelor relevante din depozit

Tabel util pentru corelarea textului lucrării cu structura codului. Căile sunt relative la rădăcina proiectului.

| Zonă | Cale | Rol sumar |
|------|------|-----------|
| Schemă DB | `prisma/schema.prisma` | Modele și enumerări |
| Migrări | `prisma/migrations/` | Istoric SQL |
| Client DB | `src/lib/db.js` | Singleton Prisma |
| Sesiune | `src/lib/auth/session.js` | Cookie, getSession |
| Token canal | `src/lib/auth/session-tokens.js` | Rotație token web/mobile |
| API auth | `src/app/api/auth/*/route.js` | Login, logout, session, register |
| API companii | `src/app/api/companies/` | CRUD contextual |
| API mașini | `src/app/api/cars/` | Flotă |
| API rezervări | `src/app/api/reservations/` | Ciclul rezervării |
| API utilizatori | `src/app/api/users/` | Membri, invitații |
| Client HTTP web | `src/lib/api.js` | Fetch-uri și antete sesiune |
| Dashboard | `src/app/dashboard/page.jsx` | Intrare principală UI |
| Gard sesiune | `src/components/dashboard/WebSessionLiveGuard.jsx` | Invalidare live |
| Android API | `android/.../ApiService.java` | Contract Retrofit |
| Android auth | `android/.../AuthRepository.java` | Login și sesiune |
| Docker | `docker-compose.yml` | Orchestrare |
| Proxy dev | `proxy-3001.js` | Acces LAN |

În Word, acest tabel poate fi transformat în landscape pe o pagină separată pentru a crește numărul de pagini tipărite fără a adăuga conținut redundant.



---


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



---



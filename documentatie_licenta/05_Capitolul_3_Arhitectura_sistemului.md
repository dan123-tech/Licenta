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

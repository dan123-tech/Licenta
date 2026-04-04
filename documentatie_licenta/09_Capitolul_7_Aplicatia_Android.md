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

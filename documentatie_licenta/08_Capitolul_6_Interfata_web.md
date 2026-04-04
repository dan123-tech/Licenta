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

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

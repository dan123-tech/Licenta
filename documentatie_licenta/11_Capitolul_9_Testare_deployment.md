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

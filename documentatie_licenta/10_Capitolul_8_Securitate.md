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

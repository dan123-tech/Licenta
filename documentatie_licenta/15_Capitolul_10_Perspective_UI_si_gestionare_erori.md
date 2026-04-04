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

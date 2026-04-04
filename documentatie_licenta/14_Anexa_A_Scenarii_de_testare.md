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

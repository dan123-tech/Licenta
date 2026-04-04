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

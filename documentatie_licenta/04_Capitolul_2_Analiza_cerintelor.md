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

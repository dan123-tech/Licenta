# Introducere

## Context și motivație

Organizațiile medii și mari care pun la dispoziția angajaților autovehicule pentru deplasări de serviciu se confruntă adesea cu lipsa unui instrument unic care să înlocuiască foi de calcul, mesagerie informală sau rezervări „la cuvânt”. Consecințele includ suprapunerea programărilor, dificultatea urmăririi responsabilului pentru o anumită perioadă și costuri mai mari de exploatare atunci când nu există o imagine clară asupra utilizării parcului.

Un sistem informatic dedicat permite standardizarea regulilor: cine poate rezerva, în ce condiții, cum se validează documentele (de exemplu permisul de conducere), cum se înregistrează predarea și returnarea vehiculului și cum pot administratorii interveni în caz de anomalii (depășire kilometraj, întârzieri, mentenanță).

Lucrarea de față pornește de la această nevoie practică și propune o soluție integrată, cu accent pe claritatea rolurilor (administrator versus utilizator obișnuit), pe trasabilitate (istoric rezervări, jurnal de acțiuni) și pe accesibilitate atât din browser, cât și de pe dispozitive mobile.

## Obiective

Obiectivele principale ale proiectului pot fi formulate astfel:

1. **Modelarea domeniului** – identificarea entităților relevante (utilizator, companie, membru, autovehicul, rezervare, invitație) și a relațiilor dintre ele, astfel încât datele să rămână coerente chiar și atunci când organizația are zeci de utilizatori și mai multe vehicule active simultan.

2. **Implementarea unui backend REST** – expunerea operațiunilor prin API-uri JSON, cu validare a intrărilor, separare între straturi (rută HTTP, logică de domeniu, acces la date) și posibilitatea documentării contractului API (OpenAPI / Swagger).

3. **Construirea unei interfețe web moderne** – panouri distincte pentru administrator și utilizator, cu componente reutilizabile, feedback vizual la erori și fluxuri ghidate (înscriere în companie, creare rezervare, aprobări).

4. **Oferirea unui client mobil** – pentru scenarii în care utilizatorul verifică disponibilitatea sau primește mementouri legate de rezervări fără a deschide laptopul.

5. **Tratarea securității la un nivel adecvat unui mediu academic îmbunătățit spre producție** – parole stocate prin funcții hash sensibile la timp, cookie-uri HTTP-only pentru sesiune, diferențiere între canalele web și mobil, mecanisme care împiedică menținerea simultană a mai multor sesiuni web valide pentru același cont acolo unde politica de securitate o cere.

## Contribuții și limitări

Contribuția lucrării constă în integrarea acestor obiective într-un singur depozit de cod, cu migrări versionate ale schemei bazei de date, scripturi de dezvoltare și suport pentru containerizare (Docker), ceea ce facilitează reproducerea mediului pe alt calculator sau pe un server de test.

Limitările sunt și ele menționate explicit: soluția nu înlocuiește un ERP complet; trimiterea e-mailurilor de invitație poate depinde de configurarea unui server SMTP extern; integrările cu surse de date externe (dacă sunt activate) presupun credențiale și politici de rețea corespunzătoare. Aceste aspecte sunt detaliate în capitolele finale.

## Structura documentului

Documentația urmează filiera logică a proiectării software: după introducere sunt prezentate fundamentele tehnologice, analiza cerințelor, arhitectura, modelul persistenței, detaliile serverului și API-ului, interfața web, aplicația mobilă, securitatea și testarea. Concluziile sintetizează rezultatele și propun direcții de extindere.

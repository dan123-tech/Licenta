# Capitolul 1. Fundamente teoretice și tehnologii utilizate

## 1.1. Arhitecturi pentru aplicații web moderne

Dezvoltarea aplicațiilor web a evoluat de la pagini generate integral pe server către modele hibride în care o parte din logică rulează în browser (JavaScript), iar serverul furnizează fie fragmente de HTML, fie date structurate (JSON). Pentru aplicațiile orientate spre productivitate și timp scurt de livrare, **monolitul aplicativ** – un singur proiect care găzduiește atât interfața, cât și punctele de intrare API – rămâne o alegere frecventă la scară mică și medie, cu posibilitatea ulterioară de extragere a serviciilor critice.

**Next.js**, framework-ul folosit în proiect, se bazează pe **React** pentru construirea interfeței și introduce convenții pentru rutare bazată pe sistemul de fișiere, componente server și rute API implementate ca *route handlers*. Avantajul pentru licență constă în învățarea unui singur ecosistem (Node.js, module ECMAScript, instrumente de build) și în posibilitatea de a descrie clar separarea între codul care rulează exclusiv pe server și cel care ajunge în bundlul client.

## 1.2. Persistență relațională și ORM

**PostgreSQL** este un sistem de gestiune a bazelor de date relaționale robust, cu suport pentru tipuri avansate, constrângeri declarative și tranzacții ACID. Pentru o aplicație în care rezervările trebuie să respecte integritatea referențială (un autovehicul aparține unei singure companii, un utilizator este legat de companie printr-o entitate de legătură), modelul relațional este natural.

**Prisma** acționează ca strat de mapare obiect-relațional: schema este declarată într-un fișier central, iar migrările generează scripturi SQL versionate. Beneficiile includ tipizare la nivel de client generat, reducerea erorilor de sintaxă în interogări și documentarea implicită a modelului prin structura `schema.prisma`.

## 1.3. API-uri REST și contracte

Stilul **REST** presupune resurse adresabile prin verbe HTTP (GET pentru citire, POST pentru creare, PATCH pentru actualizări parțiale, DELETE pentru ștergere) și reprezentări în JSON. Un contract clar (de exemplu prin **OpenAPI 3.0**) permite echipei front-end și echipei mobile să lucreze în paralel și facilitează testarea automată. În proiect, specificația poate fi expusă printr-o rută dedicată și vizualizată cu **Swagger UI**.

## 1.4. Securitatea sesiunilor și a parolelor

Parolele nu trebuie stocate în clar. Algoritmi precum **bcrypt** (sau biblioteci compatibile) aplică o funcție unidirecțională lentă intenționat, reducând utilitatea atacurilor prin dicționar. Sesiunile bazate pe **cookie** pot fi protejate cu flag-ul `HttpOnly` pentru a limita accesul din scripturile de pe pagini potențial compromise, și cu atribute `SameSite` / `Secure` adaptate mediului (dezvoltare versus producție HTTPS).

Separarea sesiunilor pe canale (ex.: browser versus aplicație nativă) este o extensie a politicii de securitate: același utilizator poate rămâne autentificat pe telefon și pe laptop, dar o politică strictă poate limita numărul de sesiuni active per canal, invalidând identificatorii vechi în baza de date.

## 1.5. Platforma Android și consumul API

Aplicațiile **Android** tradiționale comunică cu serverul prin biblioteci HTTP (de exemplu **Retrofit** peste **OkHttp**). Gestionarea cookie-urilor de sesiune pe client necesită un **CookieJar** sau echivalent, astfel încât cererile ulterioare să includă automat antetul `Cookie`. Pe lângă REST, notificările pot folosi **Firebase Cloud Messaging** pentru mesaje push, cu condiția înregistrării unui token pe server.

## 1.6. Sumar al alegerilor din proiect

| Strat | Tehnologie principală | Rol |
|--------|---------------------|-----|
| UI web | React 19, Next.js 16 | Pagini, componente client, rutare |
| API | Route handlers Next.js | Endpoint-uri JSON |
| Date | PostgreSQL + Prisma | Persistență și migrări |
| Auth | Cookie semnat, bcrypt | Autentificare și autorizare |
| Mobile | Android (Java), Retrofit | Client dedicat |
| Documentație API | OpenAPI / Swagger UI | Contract și explorare |

Aceste alegeri sunt reluate critic în capitolul de arhitectură, unde sunt mapate pe modulele concrete ale depozitului de cod.

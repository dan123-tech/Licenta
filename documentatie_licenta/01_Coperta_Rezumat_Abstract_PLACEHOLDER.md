# Copertă, rezumat și abstract – câmpuri de completat

> **Instrucțiune:** Copiați conținutul de mai jos în documentul Word principal al lucrării. Înlocuiți textele marcate cu `[...]`.

---

## Date pentru copertă / pagină de titlu

- **Universitatea:** `[numele instituției]`
- **Facultatea:** `[...]`
- **Programul de studii:** `[...]`
- **Titlul lucrării:** *Sistem informatic pentru gestionarea flotei auto partajate la nivel de companie*
- **Tip lucrare:** Lucrare de licență / Proiect de diplomă `[bifați corect]`
- **Student:** `[nume prenume]`
- **Coordonator științific:** `[titlu, nume prenume]`
- **An universitar:** `[ex.: 2025–2026]`

---

## Rezumat (RO) – model de completat (200–300 cuvinte)

Lucrarea prezintă proiectarea și implementarea unei aplicații web și a unui client mobil asociat, destinate gestionării închiriării interne a autovehiculelor unei organizații. Scopul este digitalizarea fluxurilor prin care administratorii definesc parcul auto, invită angajații în cadrul companiei, iar utilizatorii rezervă vehicule, urmăresc istoricul și respectă reguli de aprobare (ex.: permis de conducere, limite de kilometraj).

Soluția tehnică adoptată combină un monolit **Next.js** (interfață React și rute API pe același proiect), o bază de date **PostgreSQL** accesată prin **Prisma**, precum și o aplicație **Android** care consumă aceleași endpoint-uri REST. Autentificarea se bazează pe sesiuni semnate în cookie, cu mecanisme suplimentare pentru separarea sesiunilor web față de cele mobile și pentru limitarea sesiunilor concurente per canal.

Au fost modelate entități precum utilizator, companie, apartenență la companie cu roluri, autovehicule, rezervări și jurnal de audit. Sistemul include funcții administrative (invitații, gestiune flotă, rapoarte) și funcții pentru utilizatorul obișnuit (rezervări, calendar, notificări). Documentația de față descrie arhitectura, baza de date, API-ul, interfețele și considerentele de securitate.

**Cuvinte-cheie:** flotă auto, partajare resurse, Next.js, PostgreSQL, Prisma, Android, REST, sesiune, multi-tenant.

---

## Abstract (EN) – model

This thesis presents the design and implementation of a web application and a companion mobile client for managing internal car sharing within an organization. The goal is to digitize workflows in which administrators maintain a vehicle fleet, invite employees into a company workspace, and end users reserve cars while following business rules such as driving licence checks and mileage limits.

The technical stack combines a **Next.js** monolith (React UI and API route handlers), a **PostgreSQL** database accessed through **Prisma**, and an **Android** app consuming the same REST API. Authentication relies on signed session cookies, with additional logic to distinguish web and mobile sessions and to restrict concurrent sessions per channel.

Core entities include users, companies, memberships with roles, vehicles, reservations, and audit logs. Administrative features cover invitations, fleet management, and reporting, while standard users access reservations, calendars, and notifications. This document describes system architecture, database design, APIs, user interfaces, and security considerations.

**Keywords:** fleet management, resource sharing, Next.js, PostgreSQL, Prisma, Android, REST, session, multi-tenant.

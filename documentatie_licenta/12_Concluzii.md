# Concluzii

Lucrarea a prezentat proiectarea și implementarea unui sistem integrat pentru gestionarea închirierilor interne ale autovehiculelor într-o organizație, cu interfață web și client Android. S-a pus accent pe modelarea clară a entităților, pe separarea responsabilităților în cadrul monolitului Next.js și pe politici de sesiune care reflectă preocupări reale de securitate (canale distincte, invalidare controlată, reacție rapidă la pierderea sesiunii în interfață).

Rezultatul obținut demonstrează că un stack modern (React, Next.js, Prisma, PostgreSQL) poate susține un flux complet de la invitație la raportare, fără a necesita, în faza curentă, microservicii separate. Extensiile privind surse externe de date și notificările push arată direcții de evoluție către integrări enterprise.

Limitările identificate includ dependența de configurarea manuală a mediului, necesitatea unor teste automate mai extinse și posibile îmbunătățiri UX pe dispozitive cu accesibilitate redusă. Ca dezvoltări viitoare se pot menționa: roluri intermediare, aprobări multi-nivel pentru rezervări, integrare calendar organizațional, rapoarte exportabile standardizate și durabilitate operațională (metrici, alarme).

Autorul consideră că obiectivele inițiale au fost atinse într-o formă verificabilă prin codul sursă și prin documentația API, iar experiența acumulată poate fi transferată către proiecte similare de digitalizare a proceselor interne.

# Anexa B. Index orientativ al fișierelor relevante din depozit

Tabel util pentru corelarea textului lucrării cu structura codului. Căile sunt relative la rădăcina proiectului.

| Zonă | Cale | Rol sumar |
|------|------|-----------|
| Schemă DB | `prisma/schema.prisma` | Modele și enumerări |
| Migrări | `prisma/migrations/` | Istoric SQL |
| Client DB | `src/lib/db.js` | Singleton Prisma |
| Sesiune | `src/lib/auth/session.js` | Cookie, getSession |
| Token canal | `src/lib/auth/session-tokens.js` | Rotație token web/mobile |
| API auth | `src/app/api/auth/*/route.js` | Login, logout, session, register |
| API companii | `src/app/api/companies/` | CRUD contextual |
| API mașini | `src/app/api/cars/` | Flotă |
| API rezervări | `src/app/api/reservations/` | Ciclul rezervării |
| API utilizatori | `src/app/api/users/` | Membri, invitații |
| Client HTTP web | `src/lib/api.js` | Fetch-uri și antete sesiune |
| Dashboard | `src/app/dashboard/page.jsx` | Intrare principală UI |
| Gard sesiune | `src/components/dashboard/WebSessionLiveGuard.jsx` | Invalidare live |
| Android API | `android/.../ApiService.java` | Contract Retrofit |
| Android auth | `android/.../AuthRepository.java` | Login și sesiune |
| Docker | `docker-compose.yml` | Orchestrare |
| Proxy dev | `proxy-3001.js` | Acces LAN |

În Word, acest tabel poate fi transformat în landscape pe o pagină separată pentru a crește numărul de pagini tipărite fără a adăuga conținut redundant.

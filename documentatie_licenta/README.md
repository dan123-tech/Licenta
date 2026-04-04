# Documentație licență – Company Car Sharing / FleetAdmin

## Fișier principal (urmează șablonul din `00_STRUCTURA_SABLON_LUCRARE.md`)

| Fișier | Rol |
|--------|-----|
| **`LUCRARE_COMPLETA_CONFORM_SABLON.md`** | Lucrarea **asamblată într-un singur document**: parte pretextuală, rezumat, abstract, introducere, capitole 1–10, concluzii, bibliografie, anexe. **Punct de plecare recomandat pentru Word/PDF.** |
| `00_PARTEA_PRETEXTUALA_Conform_sablon.md` | Copertă (tabel), declarație pe proprie răspundere, loc pentru cuprins și liste figuri/tabele. |

## Conținut (fișiere pe capitole)

Fișierele `.md` separate urmăresc aceeași structură; poți edita un capitol și re-rula asamblarea sau edita direct `LUCRARE_COMPLETA_CONFORM_SABLON.md`. Textul descrie **proiectul din acest depozit**.

## Cum obții un document Word/PDF de ~60 pagini

1. **Importă în Word** – deschide **`LUCRARE_COMPLETA_CONFORM_SABLON.md`** (sau *Inserare → Text din fișier*), sau concatenează manual fișierele din lista de mai jos.
2. **Formatare facultate** – aplică fontul, dimensiunea, spațierea 1,5 și marginile cerute de șablonul universității.
3. **Adaugă elemente care cresc paginile în mod legitim:**
   - **Copertă și declarații** (din `01_...PLACEHOLDER.md`).
   - **Figuri**: diagrame de arhitectură, ER (din schema Prisma), capturi de ecran (login, dashboard, admin, Swagger, Android).
   - **Tabele** largi (anexe A și B sunt deja pregătite).
   - **Cuprins automat** generat de Word.
   - **Lista figurilor/tabelelor**.
4. **Extinde** capitolele unde coordonatorul cere mai multă profunzime (ex.: studiu comparativ cu alte produse, analiza riscurilor GDPR pentru datele personale din permis).

### Ordine sugerată de asamblare

1. `00_STRUCTURA_SABLON_LUCRARE.md` (doar ca ghid, nu neapărat în corpul PDF)
2. `01_Coperta_Rezumat_Abstract_PLACEHOLDER.md`
3. `02_Introducere.md`
4. `03_` … `11_` (capitole)
5. `15_Capitolul_10_...md` (sau renumerotează)
6. `12_Concluzii.md`
7. `13_Bibliografie_orientativa.md` (înlocuiește cu surse reale citate în text)
8. Anexe: `14_`, `16_`, `17_`

## Estimare volum

În format A4, 12 pt, 1,5 rânduri, **doar textul Markdown actual** echivalează aproximativ **25–40 de pagini** (în funcție de font și margini). Cu **10–20 de pagini** de figuri, tabele, copertă, cuprins și anexe extinse, totalul **60 de pagini** este realist fără umflare artificială.

## Etică academică

- **Nu** folosi tehnici menite să „păcălească” Turnitin sau alte instrumente anti-plagiat.
- **Da:** reformulare proprie, citări corecte pentru orice sursă externă, diagrame și capturi proprii, descrierea propriului cod.
- Completează bibliografia doar cu surse pe care le-ai citit și la care faci trimitere în text.

## Șablonul menționat de tine

Dacă ai un fișier Word oficial al facultății, copiază stilurile de titlu (Heading 1–3) din acel șablon peste textul importat din Markdown.

# Utvärdera ändringar i Mattebo-projektet

Denna guide hjälper dig att granska och utvärdera ändringarna som gjorts i projektet.

## 1. Visa senaste ändringar med Git

### Se de senaste commits
```bash
# Visa de senaste 20 commits
git log --oneline -20

# Visa detaljerad information om senaste commit
git log -1

# Visa ändringar i senaste commit med statistik
git show HEAD --stat
```

### Jämföra ändringar
```bash
# Se alla ändringar som gjorts
git log --all --oneline --graph --decorate

# Se detaljerade ändringar i en specifik commit
git show <commit-hash>

# Visa ändringar mellan två commits
git diff <commit1> <commit2>
```

## 2. Granska vad som lades till i projektet

Det senaste stora tillägget (commit 555ddcf) innehåller:

### Huvudkomponenter som lades till:
- **Calculator** - En matematisk miniräknare med grundläggande funktioner
- **CalculatorModal** - Modal för att visa miniräknaren i fullskärm
- **ChapterAccordion** - Accordion för att visa kapitel och lektioner
- **GradePage** - Sidor för varje årskurs (åk 6-9)
- **LessonCalendar** - Kalender för att visa lektioner och händelser
- **PostItNote** - Post-it anteckningar för eleverna
- **WebRadio** - Webbradio komponent för att spela musik

### UI-komponenter från shadcn/ui:
- Accordion, Alert Dialog, Avatar, Badge, Button
- Calendar, Card, Carousel, Chart
- Checkbox, Dialog, Dropdown Menu
- Form, Input, Label, Select, Slider
- Table, Tabs, Toast, Tooltip
- Och många fler...

### Sidor:
- `Index.tsx` - Startsida med hero-sektion och årskursval
- `Ak6.tsx`, `Ak7.tsx`, `Ak8.tsx`, `Ak9.tsx` - Sidor för årskurs 6-9

### Supabase-integration:
- `get-calendar` - Edge function för att hämta kalenderdata
- `get-resources` - Edge function för att hämta resurser från filservern

## 3. Testa applikationen lokalt

### Installera och kör

**Viktigt:** Du måste först navigera till projektmappen innan du kör kommandona.

```bash
# 1. Navigera till projektmappen (byt ut sökvägen till var du klonat projektet)
cd /sökväg/till/mattebo-builder

# Exempel:
# cd ~/Documents/mattebo-builder
# eller
# cd /Users/dittanvändarnamn/mattebo-builder

# 2. Kontrollera att du är i rätt mapp (ska visa package.json bland filerna)
ls

# 3. Installera beroenden
npm install

# 4. Starta utvecklingsservern
npm run dev
```

Öppna sedan [http://localhost:8080](http://localhost:8080) i din webbläsare.

### Vad du kan testa:
1. **Startsidan** - Visa hero-bilden och årskursvalen
2. **Årskurssidor** - Klicka på en årskurs (6, 7, 8 eller 9)
3. **Miniräknare** - Testa räknaren genom att klicka på miniräknare-ikonen
4. **Kalender** - Se läroplanens lektioner i kalendervyn
5. **Kapitel** - Öppna kapitel för att se lektioner och resurser
6. **Post-it** - Lägg till och ta bort anteckningar
7. **Webbradio** - Spela bakgrundsmusik

### Förväntade vyer när du kör applikationen:

När du öppnar applikationen ska du se:

**Startsidan (`http://localhost:8080/`):**
- Rubrik "Lasses mattegrejor" med grön bakgrund
- Underrubrik "Välj din årskurs"
- Fyra kort för årskurs 6, 7, 8 och 9 med färgglada bakgrundsbilder
- Text "Klicka på en årskurs för att se resurser och lektionsplaneringar"

**Årskurssida (t.ex. `http://localhost:8080/ak6`):**
- Rubrik "Årskurs 6"
- Hemknapp i övre vänstra hörnet
- Kapitelväljare (knappar 1-5)
- Lektionsplanering med kalender (kräver konfiguration)
- Miniräknare-ikon som öppnar en kalkylator
- Webbradio med olika musikstationer (Spa, Klassisk Rock, Pop, Faith)
- Kapitelresurser i accordion-format

**Miniräknare (när du klickar på kalkylatorn):**
- En popup-modal med en stiliserad räknare
- Funktioner: grundläggande räkning, π, kvadratrot, procent, potens
- Minneshantering (M+, MR, MC)

## 4. Granska specifika filändringar

### Se ändringar i en specifik fil
```bash
# Visa hela historiken för en fil
git log -- src/components/Calculator.tsx

# Se innehållet i en specifik fil från en commit
git show <commit-hash>:src/components/Calculator.tsx
```

### Lista alla filer som ändrats
```bash
# Visa alla filer som ändrats i senaste commit
git diff-tree --no-commit-id --name-only -r HEAD

# Visa alla filer med statistik
git show HEAD --stat
```

## 5. Granska kodkvalitet

### Kör linting
```bash
# Kontrollera kodkvalitet med ESLint
npm run lint
```

### Bygg projektet
```bash
# Bygg för produktion
npm run build

# Förhandsgranska produktionsbygget
npm run preview
```

## 6. Viktiga filer att granska

### Konfigurationsfiler:
- `package.json` - Beroenden och skript
- `vite.config.ts` - Vite-konfiguration
- `tailwind.config.ts` - Tailwind CSS-konfiguration
- `tsconfig.json` - TypeScript-konfiguration

### Huvudkomponenter:
- `src/App.tsx` - Huvudapplikation med routing
- `src/pages/Index.tsx` - Startsida
- `src/components/GradePage.tsx` - Årskurssida-komponent
- `src/components/Calculator.tsx` - Miniräknare

### Stilar:
- `src/index.css` - Global CSS med Tailwind-direktiv
- `src/App.css` - App-specifika stilar

## 7. Användbara Git-kommandon för djupare granskning

```bash
# Se ändringar rad för rad i en fil
git log -p src/components/Calculator.tsx

# Sök efter specifika ändringar
git log -S "Calculator" --source --all

# Se vem som ändrade vad i en fil
git blame src/components/Calculator.tsx

# Se ändringar som inte är committade än
git status
git diff
```

## 8. Checklist för utvärdering

- [ ] Installera och kör projektet lokalt
- [ ] Testa alla huvudfunktioner (miniräknare, kalender, kapitel)
- [ ] Kontrollera att alla årskurssidor fungerar
- [ ] Verifiera att UI-komponenter renderas korrekt
- [ ] Granska kodkvalitet med `npm run lint`
- [ ] Bygg projektet med `npm run build`
- [ ] Testa produktionsbygget med `npm run preview`
- [ ] Granska Git-historik och förstå vad som lagts till
- [ ] Kontrollera att alla beroenden är uppdaterade och säkra

## Sammanfattning

Detta projekt innehåller en komplett matematikresurs för årskurs 6-9 med:
- Modern React-applikation med TypeScript
- Interaktiv miniräknare
- Kalenderintegration
- Kapitel och lektionsinnehåll
- Post-it anteckningar
- Webbradio
- Responsiv design med Tailwind CSS
- Professionella UI-komponenter från shadcn/ui

För frågor eller problem, kontrollera `README.md` eller Git-loggen för mer information.

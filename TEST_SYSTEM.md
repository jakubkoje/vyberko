# Digitálny výberový test - System Documentation

## Prehľad

Moderný digitálny systém pre hodnotenie uchádzačov o pozície v štátnej správe Slovenskej republiky. Systém nahradza papierové testy digitálnym riešením s dôrazom na bezpečnosť, férovosť a používateľskú prívetivosť.

## Hlavné komponenty

### 1. Landing Page (`/app/pages/index.vue`)

**Účel**: Vstupná stránka pre uchádzačov s informáciami o teste a vstupným formulárom.

**Funkcie**:
- Vstupný formulár pre zadanie jednorazového prístupového kódu
- Informácie o procese testovania
- Často kladené otázky (FAQ)
- Popis toho, čo môžu uchádzači očakávať

**Sekcie**:
- Hero sekcia s vstupným poľom pre kód
- Moderné riešenie výberového konania
- Čo očakávať počas testu (6 bodov)
- Absolvujte test v 3 krokoch
- FAQ (8 otázok)
- Call to action pre technickú podporu

### 2. Test Page (`/app/pages/test.vue`)

**Účel**: Hlavná stránka na absolvovanie testu.

**Funkcie**:
- Zobrazenie zostávajúceho času
- Integrácia s custom NuxtUI preview komponentom
- Automatické ukladanie progresu do localStorage
- Auto-submit pri vypršaní času
- Presmerovanie na completion page po dokončení

**Query parametre**:
- `code`: Prístupový kód uchádzača (povinný)

### 3. Custom Preview Component (`/app/components/survey/CustomPreview.vue`)

**Účel**: Vlastné renderovanie SurveyJS testov pomocou NuxtUI komponentov namiesto štandardných SurveyJS komponentov.

**Podporované typy elementov**:
- HTML content
- Text input / Email input
- Textarea / Comment
- Dropdown / Select
- Radio group
- Checkbox group
- Boolean / Toggle
- Rating

**Funkcie**:
- Automatický progress bar
- Paginovaný režim (stránka po stránke)
- Validácia vstupov
- Character counter pre textové polia
- Responsive dizajn
- Slovenský jazyk

### 4. Test Complete Page (`/app/pages/test-complete.vue`)

**Účel**: Potvrdenie úspešného dokončenia testu.

**Obsah**:
- Success message
- Informácie o ďalších krokoch
- Timeline výsledkov
- Kontaktné informácie

### 5. Admin Test Creator (`/app/pages/admin/test-creator.vue`)

**Účel**: Administrátorské rozhranie na vytváranie a úpravu testov.

**Funkcie**:
- 3 taby:
  1. **Designer**: SurveyJS Creator pre vizuálnu tvorbu testov
  2. **Náhľad (NuxtUI)**: Preview používajúci custom NuxtUI komponenty
  3. **JSON Editor**: Manuálna úprava JSON konfigurácie

**Features**:
- Auto-save funkcionalita
- Export/Import JSON konfigurácie
- Real-time preview
- Copy to clipboard

### 6. Survey Creator Component (`/app/components/survey/Creator.vue`)

**Účel**: Vue 3 wrapper pre SurveyJS Creator.

**Funkcie**:
- Integrácia SurveyCreatorModel
- Auto-save callback
- Change detection
- Emity pre parent komponenty

## Technický Stack

### Frontend
- **Nuxt 3**: Vue 3 framework
- **NuxtUI**: UI komponenty (UCard, UButton, UInput, atď.)
- **SurveyJS**: 
  - `survey-creator-vue` (v2.3.10): Pre tvorbu testov
  - `survey-core`: Core funkcionality

### Styling
- Tailwind CSS (cez NuxtUI)
- Custom CSS pre SurveyJS integráciu
- Responsive dizajn

## Workflow

### Pre uchádzačov

1. **Vstup na landing page** (`/`)
   - Prečítanie informácií o teste
   - FAQ pre odpovede na otázky

2. **Zadanie prístupového kódu**
   - Získaný emailom/poštou
   - Jednorazové použitie

3. **Absolvovanie testu** (`/test?code=XXX`)
   - Zobrazenie inštrukcií
   - Postupné vyplnenie všetkých sekcií
   - Monitoring zostávajúceho času
   - Automatické ukladanie progresu

4. **Dokončenie** (`/test-complete`)
   - Potvrdenie úspešného odoslania
   - Informácie o ďalších krokoch

### Pre administrátorov

1. **Prihlásenie do admin sekcie** (`/admin/test-creator`)

2. **Tvorba testu**
   - **Designer tab**: Drag & drop komponenty
   - **Preview tab**: Otestovanie s NuxtUI komponentmi
   - **JSON Editor**: Pokročilé úpravy

3. **Uloženie konfigurácie**
   - Auto-save pri zmenách
   - Manuálne uloženie do databázy
   - Export JSON

## Konfigurácia testov

### Štruktúra JSON

```json
{
  "title": "Názov testu",
  "description": "Popis testu",
  "showProgressBar": "top",
  "progressBarType": "buttons",
  "showQuestionNumbers": "off",
  "pages": [
    {
      "name": "page-id",
      "title": "Názov stránky",
      "description": "Popis stránky",
      "elements": [
        {
          "type": "text|comment|dropdown|radiogroup|checkbox|...",
          "name": "question-id",
          "title": "Otázka",
          "isRequired": true,
          "placeholder": "Placeholder text"
        }
      ]
    }
  ]
}
```

### Príklad testu

Test obsahuje:
1. **Inštrukcie** - HTML element s popisom
2. **Test prepisu textu** - Comment field pre prepis textu
3. **Vyplnenie formulára** - Rôzne typy vstupov
4. **Kontrola odpovedí** - Final review

## Bezpečnosť

- **Jednorazové kódy**: Každý kód platný iba raz
- **Časový limit**: Automatické odoslanie po vypršaní
- **Auto-save**: Ochrana proti strate dát
- **Validácia**: Client-side aj server-side validácia (TODO)

## TODO / Budúce vylepšenia

### Backend integrácia
- [ ] API endpoint pre validáciu kódov
- [ ] API endpoint pre odosielanie výsledkov
- [ ] API endpoint pre ukladanie testových konfigurácií
- [ ] Databázové schémy pre testy a výsledky

### Funkcie
- [ ] Multi-language podpora
- [ ] Accessibility vylepšenia
- [ ] Offline režim
- [ ] PDF export výsledkov
- [ ] Analytics a reporting
- [ ] Role-based access control pre adminov

### UX vylepšenia
- [ ] Prípravný režim (practice mode)
- [ ] Keyboard shortcuts
- [ ] Dark mode
- [ ] Notification system pre upozornenia

## API Endpoints (TODO)

### Verejné
- `POST /api/test/validate-code` - Validácia prístupového kódu
- `POST /api/test/submit` - Odoslanie výsledkov testu
- `GET /api/test/configuration` - Získanie konfigurácie testu

### Admin
- `POST /api/test/configuration` - Uloženie konfigurácie
- `GET /api/test/results` - Získanie výsledkov
- `POST /api/test/generate-codes` - Generovanie kódov

## Deployment

### Environment variables
```env
DATABASE_URL=postgresql://...
NUXT_PUBLIC_API_URL=https://api.example.com
```

### Build
```bash
pnpm install
pnpm build
```

### Production
```bash
pnpm preview
# alebo
node .output/server/index.mjs
```

## Kontakt

Pre technické otázky kontaktujte vývojový tím na podpora@vyberko.sk


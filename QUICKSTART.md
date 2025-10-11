# Quick Start Guide - Digitálny výberový test

## 🚀 Latest Updates

### ✅ Backend Integration Ready
- Tests are now loaded from JSON files (backend-ready)
- Automatic scoring with correct answer validation
- Support for radio groups, checkboxes, and all input types
- Results page with detailed feedback
- API endpoints prepared for database integration

## Čo bolo vytvorené

### ✅ Hotové komponenty

1. **Landing Page** (`/`) - Slovenská vstupná stránka s:
   - Vstupným formulárom pre prístupový kód
   - Informáciami o teste
   - FAQ sekciou
   - Popisom procesu

2. **Test Page** (`/test?code=XXX`) - Stránka na absolvovanie testu:
   - Custom NuxtUI rendering (namiesto SurveyJS defaultných štýlov)
   - Timer s odpočítavaním
   - Auto-save funkcia
   - Auto-submit pri vypršaní času

3. **Custom Preview Component** (`/app/components/survey/CustomPreview.vue`):
   - Kompletné renderovanie testov pomocou NuxtUI
   - Podporuje všetky bežné typy inputov
   - Paginated mode s progress barom
   - Slovenský jazyk

4. **Test Complete Page** (`/test-complete`) - Potvrdenie dokončenia

5. **Admin Test Creator** (`/admin/test-creator`) - 3-tabové rozhranie:
   - Designer tab - SurveyJS Creator
   - Preview tab - Custom NuxtUI preview
   - JSON Editor tab - Manuálna úprava

6. **Survey Creator Component** (`/app/components/survey/Creator.vue`):
   - Vue 3 wrapper pre SurveyJS Creator
   - Auto-save funkcia

## Spustenie projektu

```bash
# Inštalácia závislostí
pnpm install

# Spustenie dev servera
pnpm dev

# Otvorte v prehliadači
# http://localhost:3000
```

## Testovanie funkcií

### 1. Landing Page
```
Navštívte: http://localhost:3000
```
- Zadajte ľubovoľný kód (např. "TEST-2024")
- Kliknite "Spustiť test"

### 2. Test Page with JSON Configuration
```
Navštívte: http://localhost:3000/test?code=TEST-2024
```
- Test sa automaticky načíta z `public/test.example.json`
- Uvidíte test s NuxtUI komponentmi
- Timer bude odpočítavať (ak je zapnutý v JSON)
- Postupujte stránkami
- Kliknite "Odoslať test" na konci

### 3. Test Results Page
```
Po dokončení testu: http://localhost:3000/test-results?code=TEST-2024
```
- Zobrazí sa skóre a percentuálna úspešnosť
- Detail pre každú otázku (správne/nesprávne)
- Porovnanie vašej odpovede s správnou odpoveďou

### 3. Admin Test Creator
```
Navštívte: http://localhost:3000/admin/test-creator
```
- **Designer tab**: Vytvorte test pomocą drag & drop
- **Náhľad tab**: Pozrite si ako vyzerá s NuxtUI
- **JSON Editor**: Upravte konfiguráciu manuálne

## Kľúčové vlastnosti

### ✨ Custom NuxtUI Preview

**Namiesto defaultných SurveyJS komponentov používame NuxtUI:**
- `UCard` pre wrapper
- `UInput` pre text fieldy
- `UTextarea` pre textové oblasti
- `USelect` pre dropdown menu
- `URadioGroup` pre radio buttony
- `UCheckbox` pre checkboxy
- `UButton` pre navigačné tlačidlá
- `UProgress` pre progress bar
- `UBadge` pre badgy

### 🎨 Slovenský jazyk

Všetky texty sú v slovenčine:
- UI komponenty
- Chybové hlášky
- Inštrukcie
- FAQ

### 🔒 Bezpečnosť

- Jednorazové prístupové kódy
- Časový limit s auto-submit
- Auto-save do localStorage

### 📱 Responsive

Všetky komponenty sú plne responsive a fungujú na:
- Desktop
- Tablet
- Mobile

## Konfigurácia testu pomocou JSON

### Test Structure

Testy sa teraz načítavajú z JSON súborov, ktoré sa ukladajú v backend databáze.

**Príklad: `test.example.json`**
```json
{
  "title": "Odborny test",
  "description": "Test na overenie odbornych znalosti",
  "showTimer": true,
  "maxTimeToFinish": 1800,
  "pages": [
    {
      "name": "page1",
      "elements": [
        {
          "type": "radiogroup",
          "name": "question1",
          "title": "Ako sa mas?",
          "correctAnswer": "Item 1",
          "isRequired": true,
          "choices": [
            { "value": "Item 1", "text": "dobre" },
            { "value": "Item 2", "text": "nie dobre" }
          ]
        },
        {
          "type": "checkbox",
          "name": "question2",
          "title": "Oznacte vsetky spisovne slova.",
          "correctAnswer": ["Item 1", "Item 2", "Item 3"],
          "choices": [
            { "value": "Item 1", "text": "jakub" },
            { "value": "Item 2", "text": "ano" },
            { "value": "Item 3", "text": "itinerar" }
          ]
        }
      ]
    }
  ]
}
```

### Kľúčové polia

- **`correctAnswer`**: Správna odpoveď pre automatické hodnotenie
  - String pre radiogroup, text, dropdown
  - Array pre checkbox (viacnásobný výber)
- **`showTimer`**: Zapnúť/vypnúť timer
- **`maxTimeToFinish`**: Časový limit v sekundách

### Backend Integrácia

**1. Načítanie konfigurácie**
```typescript
// Aktuálne: Načíta z public/test.example.json
const response = await $fetch('/test.example.json')

// Production: Načíta z API
const response = await $fetch('/api/test/configuration', {
  query: { code: accessCode }
})
```

**2. Odoslanie výsledkov**
```typescript
await $fetch('/api/test/submit', {
  method: 'POST',
  body: {
    code: accessCode,
    results: userAnswers,
    score: calculatedScore,
    timeSpent: elapsedTime
  }
})
```

**API Endpoints pripravené:**
- `GET /api/test/configuration?code=XXX` - Načítanie testu
- `POST /api/test/submit` - Odoslanie výsledkov

Viac info: `TEST_JSON_STRUCTURE.md`

### Podporované typy elementov

- `html` - HTML content
- `text` - Text input
- `comment` - Textarea
- `dropdown` - Select/Dropdown
- `radiogroup` - Radio buttons
- `checkbox` - Checkboxes
- `boolean` - Toggle switch
- `rating` - Rating scale

## Štruktúra projektu

```
app/
├── pages/
│   ├── index.vue                    # Landing page
│   ├── test.vue                     # Test page
│   ├── test-complete.vue            # Completion page
│   └── admin/
│       └── test-creator.vue         # Admin creator
└── components/
    └── survey/
        ├── CustomPreview.vue        # Custom NuxtUI preview
        └── Creator.vue              # Survey creator wrapper
```

## Ďalšie kroky

### Backend integrácia (TODO)

1. **Vytvorte API endpoints**:
```typescript
// server/api/test/validate-code.post.ts
export default defineEventHandler(async (event) => {
  const { code } = await readBody(event)
  // Validujte kód v databáze
  return { valid: true }
})

// server/api/test/submit.post.ts
export default defineEventHandler(async (event) => {
  const { code, results } = await readBody(event)
  // Uložte výsledky do databázy
  return { success: true }
})
```

2. **Aktualizujte test.vue**:
```typescript
// Odkomentujte API volania v handleComplete()
const handleComplete = async (results: any) => {
  await $fetch('/api/test/submit', {
    method: 'POST',
    body: { code: code.value, results }
  })
}
```

### Customizácia

1. **Zmena časového limitu**:
```typescript
// V test.vue, riadok 37
const timeRemaining = ref(2700) // 45 minút v sekundách
```

2. **Pridanie nového typu elementu do CustomPreview**:
```vue
<!-- V CustomPreview.vue, pridajte nový v-else-if block -->
<UFormGroup
  v-else-if="element.type === 'date'"
  :label="element.title"
  :required="element.isRequired"
>
  <UInput
    v-model="answers[element.name]"
    type="date"
  />
</UFormGroup>
```

3. **Zmena farebnej schémy**:
```typescript
// V nuxt.config.ts
export default defineNuxtConfig({
  ui: {
    primary: 'green', // namiesto primary
  }
})
```

## Riešenie problémov

### SurveyJS sa nenačíta
```bash
# Skontrolujte, či sú nainštalované balíčky
pnpm list survey-creator-vue
pnpm list survey-core

# Ak nie, nainštalujte
pnpm add survey-creator-vue survey-core survey-creator-core
```

### Chyby TypeScript
```bash
# Regenerujte typy
pnpm typecheck
```

### Styling problémy
```bash
# Uistite sa, že sú importované CSS súbory
# V components/survey/Creator.vue a CustomPreview.vue
```

## Podpora

Pre otázky alebo problémy:
- Dokumentácia: `TEST_SYSTEM.md`
- Email: podpora@vyberko.sk

## Changelog

**v1.0.0** (2025-10-11)
- ✅ Slovenská landing page
- ✅ Custom NuxtUI preview namiesto SurveyJS defaultu
- ✅ Admin test creator s 3 tabmi
- ✅ Timer a auto-submit
- ✅ Auto-save funkcionalita
- ✅ FAQ sekcia
- ✅ Completion page


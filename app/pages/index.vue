<template>
  <div
    v-if="page"
    class="relative"
  >
    <div class="hidden lg:block">
      <UColorModeImage
        light="/images/light/line-1.svg"
        dark="/images/dark/line-1.svg"
        class="absolute pointer-events-none pb-10 left-0 top-0 object-cover h-[650px]"
      />
    </div>

    <UPageHero
      :description="page.description"
      :ui="{
        container: 'md:pt-18 lg:pt-20',
        title: 'max-w-3xl mx-auto'
      }"
    >
      <template #top>
        <HeroBackground />
      </template>

      <template #title>
        <MDC
          :value="page.title"
          unwrap="p"
        />
      </template>

      <template #links>
        <div class="flex flex-col items-center gap-4 w-full max-w-md mx-auto mt-8">
          <UFormGroup
            label="Zadajte váš prístupový kód"
            class="w-full"
            size="xl"
          >
            <UInput
              v-model="accessCode"
              placeholder="XXXX-XXXX-XXXX"
              size="xl"
              class="text-center"
              :ui="{ base: 'text-center uppercase' }"
              @keyup.enter="startTest"
            />
          </UFormGroup>
          <UButton
            size="xl"
            color="primary"
            block
            :disabled="!accessCode || accessCode.length < 5"
            @click="startTest"
          >
            Spustiť test
            <template #trailing>
              <UIcon name="i-lucide-arrow-right" />
            </template>
          </UButton>
        </div>
      </template>
    </UPageHero>

    <UPageSection
      :description="page.section.description"
      :features="page.section.features"
      orientation="horizontal"
      :ui="{
        container: 'lg:px-0 2xl:px-20 mx-0 max-w-none md:mr-10',
        features: 'gap-0'
      }"
      reverse
    >
      <template #title>
        <MDC
          :value="page.section.title"
          class="sm:*:leading-11"
        />
      </template>
      <img
        :src="page.section.images.desktop"
        :alt="page.section.title"
        class="hidden lg:block 2xl:hidden left-0 w-full max-w-2xl"
      >
      <img
        :src="page.section.images.mobile"
        :alt="page.section.title"
        class="block lg:hidden 2xl:block 2xl:w-full 2xl:max-w-2xl"
      >
    </UPageSection>

    <USeparator :ui="{ border: 'border-primary/30' }" />

    <UPageSection
      id="features"
      :description="page.features.description"
      :features="page.features.features"
      :ui="{
        title: 'text-left @container relative flex',
        description: 'text-left'
      }"
      class="relative overflow-hidden"
    >
      <div class="absolute rounded-full -left-10 top-10 size-[300px] z-10 bg-primary opacity-30 blur-[200px]" />
      <div class="absolute rounded-full -right-10 -bottom-10 size-[300px] z-10 bg-primary opacity-30 blur-[200px]" />
      <template #title>
        <MDC
          :value="page.features.title"
          class="*:leading-9"
        />
        <div class="hidden @min-[1020px]:block">
          <UColorModeImage
            light="/images/light/line-2.svg"
            dark="/images/dark/line-2.svg"
            class="absolute top-0 right-0 size-full transform scale-95 translate-x-[70%]"
          />
        </div>
      </template>
    </UPageSection>

    <USeparator :ui="{ border: 'border-primary/30' }" />

    <UPageSection
      id="steps"
      :description="page.steps.description"
      class="relative overflow-hidden"
    >
      <template #headline>
        <UColorModeImage
          light="/images/light/line-3.svg"
          dark="/images/dark/line-3.svg"
          class="absolute -top-10 sm:top-0 right-1/2 h-24"
        />
      </template>
      <template #title>
        <MDC :value="page.steps.title" />
      </template>

      <template #features>
        <UPageCard
          v-for="(step, index) in page.steps.items"
          :key="index"
          class="group"
          :ui="{ container: 'p-4 sm:p-4', title: 'flex items-center gap-1' }"
        >
          <UColorModeImage
            v-if="step.image"
            :light="step.image?.light"
            :dark="step.image?.dark"
            :alt="step.title"
            class="size-full"
          />

          <div class="flex flex-col gap-2">
            <span class="text-lg font-semibold">
              {{ step.title }}
            </span>
            <span class="text-sm text-muted">
              {{ step.description }}
            </span>
          </div>
        </UPageCard>
      </template>
    </UPageSection>


    <UPageSection
      id="faq"
      :title="page.faq.title"
      :description="page.faq.description"
    >
      <template #headline>
        <UColorModeImage
          light="/images/light/line-5.svg"
          dark="/images/dark/line-5.svg"
          class="absolute -top-10 sm:top-0 right-1/2 h-24"
        />
      </template>
      <template #title>
        <MDC :value="page.faq.title" />
      </template>

      <UContainer>
        <UAccordion
          :items="page.faq.items"
          :ui="{ wrapper: 'flex flex-col gap-4' }"
          size="xl"
          variant="soft"
        >
          <template #default="{ item, open }">
            <UButton
              variant="ghost"
              class="w-full justify-between"
              size="xl"
            >
              <span class="text-left font-semibold">{{ item.question }}</span>
              <UIcon
                :name="open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                class="ms-auto"
              />
            </UButton>
          </template>
          <template #item="{ item }">
            <div class="text-muted p-4">
              {{ item.answer }}
            </div>
          </template>
        </UAccordion>
      </UContainer>
    </UPageSection>

    <USeparator />

    <UPageCTA
      :title="page.cta.title"
      :description="page.cta.description"
      variant="naked"
      class="overflow-hidden @container"
    >
      <template #title>
        <MDC :value="page.cta.title" />

        <div class="@max-[1280px]:hidden">
          <UColorModeImage
            light="/images/light/line-6.svg"
            dark="/images/dark/line-6.svg"
            class="absolute left-10 -top-10 sm:top-0 h-full"
          />
          <UColorModeImage
            light="/images/light/line-7.svg"
            dark="/images/dark/line-7.svg"
            class="absolute right-0 bottom-0 h-full"
          />
        </div>
      </template>

      <LazyStarsBg />
    </UPageCTA>
  </div>
</template>

<script setup lang="ts">
const accessCode = ref('')

const startTest = () => {
  if (accessCode.value && accessCode.value.length >= 5) {
    // Navigate to test page with the access code
    navigateTo(`/test?code=${accessCode.value}`)
  }
}

const page = ref({
  seo: {
    title: "Digitálny výberový test - Štátna správa SR",
    description: "Moderný digitálny systém na hodnotenie uchádzačov o pozície v štátnej správe Slovenskej republiky."
  },
  title: "Digitálny výberový test pre [štátnu správu]{.text-primary}",
  description: "Vitajte v modernom systéme hodnotenia uchádzačov. Zadajte váš jedinečný prístupový kód a začnite test.",
  hero: {},
  section: {
    title: "[Moderné]{.text-primary} riešenie výberového konania",
    description: "Prechod z papierových testov na digitálnu platformu prináša efektívnosť, presnosť a pohodlie pre všetkých účastníkov.",
    images: {
      mobile: "/images/macbook-mobile.svg",
      desktop: "/images/macbook.svg"
    },
    features: [
      {
        title: "Bezpečný prístup",
        description: "Každý uchádzač dostane jedinečný jednorazový prístupový kód, ktorý zabezpečuje férovosť a bezpečnosť celého procesu hodnotenia.",
        class: "border-l border-primary pl-4"
      },
      {
        title: "Intuitívne rozhranie",
        description: "Jednoduché a prehľadné rozhranie, ktoré vás krok za krokom prevedie celým testom. Žiadne technické znalosti nie sú potrebné.",
        class: "border-l border-default pt-4 pl-4"
      },
      {
        title: "Okamžité vyhodnotenie",
        description: "Po dokončení testu systém automaticky vyhodnotí vaše výsledky a poskytne spätnú väzbu. Celý proces je transparentný a spravodlivý.",
        class: "border-l border-default pt-4 pl-4"
      }
    ]
  },
  features: {
    title: "Čo môžete [očakávať]{.text-primary} počas testu",
    description: "Digitálny test je navrhnutý tak, aby bol jednoduchý, spravodlivý a efektívny pre všetkých uchádzačov.",
    features: [
      {
        title: "Test písania na klávesnici",
        description: "Hodnotenie rýchlosti a presnosti písania na klávesnici - základné zručnosti potrebné pre administratívne pozície.",
        icon: "i-lucide-keyboard",
        ui: {
          leading: "bg-accented/50 p-2 rounded-md border border-muted border-dashed"
        }
      },
      {
        title: "Časový limit",
        description: "Test má stanovený časový limit. Sledujte zostávajúci čas na obrazovke a prispôsobte svoje tempo.",
        icon: "i-lucide-clock",
        ui: {
          leading: "bg-accented/50 p-2 rounded-md border border-muted border-dashed"
        }
      },
      {
        title: "Automatické ukladanie",
        description: "Váš postup sa priebežne automaticky ukladá, takže sa nemusíte obávať straty dát.",
        icon: "i-lucide-save",
        ui: {
          leading: "bg-accented/50 p-2 rounded-md border border-muted border-dashed"
        }
      },
      {
        title: "Jednoduché inštrukcie",
        description: "Pred začiatkom každej časti testu dostanete jasné inštrukcie a môžete si precvičiť ovládanie.",
        icon: "i-lucide-file-text",
        ui: {
          leading: "bg-accented/50 p-2 rounded-md border border-muted border-dashed"
        }
      },
      {
        title: "Technická podpora",
        description: "V prípade technických problémov je k dispozícii tím podpory, ktorý vám pomôže.",
        icon: "i-lucide-headphones",
        ui: {
          leading: "bg-accented/50 p-2 rounded-md border border-muted border-dashed"
        }
      },
      {
        title: "Transparentné hodnotenie",
        description: "Po dokončení testu získate spätnú väzbu o vašom výkone. Hodnotenie je objektívne a automatizované.",
        icon: "i-lucide-chart-bar",
        ui: {
          leading: "bg-accented/50 p-2 rounded-md border border-muted border-dashed"
        }
      }
    ]
  },
  steps: {
    title: "Absolvujte test v [3 jednoduchých krokoch]{.text-primary}",
    description: "Postupujte podľa týchto krokov a úspešne dokončíte digitálny výberový test.",
    items: [
      {
        title: "1. Zadajte prístupový kód",
        description: "Zadajte jedinečný prístupový kód, ktorý ste dostali emailom alebo poštou. Tento kód je platný iba jedenkrát a zabezpečuje, že test absolvujete vy osobne.",
        image: {
          light: "/images/light/connect.svg",
          dark: "/images/dark/connect.svg"
        }
      },
      {
        title: "2. Prečítajte si inštrukcie",
        description: "Pred začiatkom testu sa oboznámte s inštrukciami. Môžete si vyskúšať krátku ukážku, aby ste sa zoznámili s rozhraním a ovládaním.",
        image: {
          light: "/images/light/optimize.svg",
          dark: "/images/dark/optimize.svg"
        }
      },
      {
        title: "3. Absolvujte test a odošlite",
        description: "Dokončite všetky časti testu v stanovenom čase. Po ukončení systém automaticky vyhodnotí vaše výsledky a dostanete spätnú väzbu.",
        image: {
          light: "/images/light/track.svg",
          dark: "/images/dark/track.svg"
        }
      }
    ]
  },
  faq: {
    title: "Často kladené [otázky]{.text-primary}",
    description: "Odpovede na najčastejšie otázky o digitálnom výberovom teste.",
    items: [
      {
        label: "Ako získam prístupový kód?",
        question: "Ako získam prístupový kód?",
        answer: "Prístupový kód dostanete emailom alebo poštou po úspešnom podaní prihlášky na výberové konanie. Kód je jedinečný a platný iba jedenkrát pre vás.",
        defaultOpen: false
      },
      {
        label: "Ako dlho trvá test?",
        question: "Ako dlho trvá test?",
        answer: "Test má stanovený časový limit, ktorý sa zobrazí na začiatku. Zvyčajne trvá 30-45 minút. Počas testu vidíte zostávajúci čas na obrazovke.",
        defaultOpen: false
      },
      {
        label: "Čo ak mám technické problémy?",
        question: "Čo ak mám technické problémy?",
        answer: "V prípade technických problémov kontaktujte technickou podporu na uvedenom telefónnom čísle alebo emaile. Váš prístupový kód zostane aktívny, kým test úspešne nedokončíte.",
        defaultOpen: false
      },
      {
        label: "Môžem test prerušiť a pokračovať neskôr?",
        question: "Môžem test prerušiť a pokračovať neskôr?",
        answer: "Test by ste mali dokončiť v jednom sedení. Váš postup sa síce automaticky ukladá, ale časový limit beží od momentu, kedy test začnete.",
        defaultOpen: false
      },
      {
        label: "Aké technické vybavenie potrebujem?",
        question: "Aké technické vybavenie potrebujem?",
        answer: "Potrebujete počítač alebo notebook s fungujúcou klávesnicou a pripojenie na internet. Test funguje v moderných webových prehliadačoch (Chrome, Firefox, Safari, Edge).",
        defaultOpen: false
      },
      {
        label: "Kedy sa dozviem výsledky?",
        question: "Kedy sa dozviem výsledky?",
        answer: "Základné výsledky uvidíte ihneď po dokončení testu. Podrobné vyhodnotenie a informácie o ďalších krokoch výberového konania dostanete emailom do 5 pracovných dní.",
        defaultOpen: false
      },
      {
        label: "Môžem test zopakovať?",
        question: "Môžem test zopakovať?",
        answer: "Každý prístupový kód je jednorazový a platný iba pre jedno absolvovanie testu. Opakovanie testu nie je možné, preto test absolvujte až keď ste na to pripravení.",
        defaultOpen: false
      },
      {
        label: "Je test prispôsobený pre ľudí so zdravotným postihnutím?",
        question: "Je test prispôsobený pre ľudí so zdravotným postihnutím?",
        answer: "Áno, systém podporuje rôzne formy prístupnosti. Ak potrebujete špeciálne úpravy, kontaktujte nás pred absolvovaním testu a dohodneme vhodné riešenie.",
        defaultOpen: false
      }
    ]
  },
  cta: {
    title: "Máte otázky alebo potrebujete [pomoc]{.text-primary}?",
    description: "Náš tím technickej podpory je tu pre vás. Kontaktujte nás pred začatím testu, ak máte akékoľvek nejasnosti."
  }
})

useSeoMeta({
  title: page.value.seo?.title || page.value.title,
  ogTitle: page.value.seo?.title || page.value.title,
  description: page.value.seo?.description || page.value.description,
  ogDescription: page.value.seo?.description || page.value.description
})
</script>

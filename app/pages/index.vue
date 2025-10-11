<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <UIcon
                  name="i-lucide-building-2"
                  class="text-white text-xl"
                />
              </div>
              <div>
                <h1 class="text-lg font-semibold text-gray-900">
                  Centrálny informačný systém štátnej služby
                </h1>
                <p class="text-sm text-gray-600">
                  Digitálny výberový test
                </p>
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <UInput
              v-model="searchQuery"
              placeholder="Zadajte hľadaný výraz"
              class="w-64"
            >
              <template #trailing>
                <UIcon
                  name="i-lucide-search"
                  class="text-gray-400"
                />
              </template>
            </UInput>
            <UButton
              color="green"
              variant="solid"
            >
              Prihlásiť sa
            </UButton>
          </div>
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <nav class="bg-white border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex space-x-8 py-3">
          <a
            href="#"
            class="text-gray-700 hover:text-blue-600 font-medium"
          >Aktuality</a>
          <a
            href="#"
            class="text-gray-700 hover:text-blue-600 font-medium"
          >Výberové konania</a>
          <a
            href="#"
            class="text-gray-700 hover:text-blue-600 font-medium"
          >Výstupy pre verejnosť</a>
          <a
            href="#"
            class="text-gray-700 hover:text-blue-600 font-medium flex items-center"
          >
            Informácie
            <UIcon
              name="i-lucide-chevron-down"
              class="ml-1 text-sm"
            />
          </a>
          <a
            href="#"
            class="text-gray-700 hover:text-blue-600 font-medium"
          >Kontakty</a>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-blue-50 to-indigo-100 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-gray-900 mb-6">
            Vyberte si z <span class="text-blue-600">105 voľných miest</span> v štátnej službe
          </h1>
          <p class="text-xl text-gray-600 mb-8 max-w-4xl mx-auto">
            Verejný portál Centrálneho informačného systému štátnej služby poskytuje informácie a služby verejnosti,
            uchádzačom o štátnu službu, štátnym zamestnancom, bývalým štátnym zamestnancom a absolventom.
          </p>

          <!-- Access Code Form -->
          <div class="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <h2 class="text-2xl font-semibold text-gray-900 mb-6">
              Spustiť digitálny test
            </h2>
            <UFormGroup
              label="Zadajte váš prístupový kód"
              class="w-full mb-4"
            >
              <UInput
                v-model="accessCode"
                placeholder="XXXX-XXXX-XXXX"
                size="lg"
                class="text-center mb-3"
                :ui="{ base: 'text-center uppercase' }"
                @keyup.enter="startTest"
              />
            </UFormGroup>
            <UButton
              size="lg"
              color="primary"
              block
              @click="startTest"
            >
              Spustiť test
              <template #trailing>
                <UIcon name="i-lucide-arrow-right" />
              </template>
            </UButton>
            <a
              href="#"
              class="text-blue-600 hover:text-blue-700 text-sm mt-4 inline-block"
            >
              Zobraziť vyhlásené výberové konania
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        <!-- Applicant Section -->
        <div class="bg-white rounded-lg shadow-md p-8">
          <div class="flex items-center mb-6">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <UIcon
                name="i-lucide-user"
                class="text-blue-600 text-xl"
              />
            </div>
            <h2 class="text-2xl font-semibold text-gray-900">
              Uchádzač o štátnu službu
            </h2>
          </div>
          <p class="text-gray-600 mb-6">
            Nájdite si vhodnú pozíciu, vytvorte si profil a vyhľadávajte podľa vašich preferencií.
            Uchádzajte sa o pozície v štátnej správe a staňte sa súčasťou verejnej služby.
          </p>
          <UButton
            color="primary"
            variant="outline"
          >
            Začať uchádzanie
          </UButton>
        </div>

        <!-- Graduate Section -->
        <div class="bg-white rounded-lg shadow-md p-8">
          <div class="flex items-center mb-6">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <UIcon
                name="i-lucide-graduation-cap"
                class="text-green-600 text-xl"
              />
            </div>
            <h2 class="text-2xl font-semibold text-gray-900">
              Absolvent
            </h2>
          </div>
          <p class="text-gray-600 mb-6">
            Vytvorte si profil absolventa, vyhľadajte si vhodné pozície alebo sa zaregistrujte
            v databáze absolventov. Nájdite svoju cestu v štátnej správe.
          </p>
          <UButton
            color="green"
            variant="outline"
          >
            Registrovať sa ako absolvent
          </UButton>
        </div>
      </div>

      <!-- Create Account Section -->
      <div class="bg-blue-50 rounded-lg p-8 mb-16">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">
            Vytvorte si používateľský účet
          </h2>
          <p class="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Vytvorením používateľského účtu získate prístup k správe vášho profilu,
            možnosti uchádzania sa o pozície a využívaniu ďalších služieb portálu.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton
              size="lg"
              color="primary"
            >
              Vytvoriť používateľský účet
            </UButton>
            <span class="text-gray-600 flex items-center justify-center">
              Máte vytvorený používateľský účet?
              <UButton
                variant="link"
                color="primary"
                class="ml-2"
              >
                Prihlásiť sa
              </UButton>
            </span>
          </div>
        </div>
      </div>

      <!-- News Section -->
      <section class="mb-16">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900">
            Aktuality
          </h2>
          <UButton
            variant="link"
            color="primary"
          >
            Zobraziť viac aktualít
            <UIcon
              name="i-lucide-arrow-right"
              class="ml-1"
            />
          </UButton>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="h-48 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center">
              <div class="text-center text-white">
                <h3 class="text-lg font-semibold mb-2">
                  CENTRÁLNY INFORMAČNÝ SYSTÉM
                </h3>
                <p class="text-sm opacity-90">
                  ŠTÁTNEJ SLUŽBY (CISŠS)
                </p>
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center text-sm text-gray-500 mb-3">
                <UIcon
                  name="i-lucide-calendar"
                  class="mr-2"
                />
                7. máj 2025
              </div>
              <h4 class="text-xl font-semibold text-gray-900 mb-3">
                <a
                  href="#"
                  class="hover:text-blue-600"
                >Aktualizácia používateľskej príručky</a>
              </h4>
              <p class="text-gray-600">
                Nová verzia používateľskej príručky je dostupná s aktualizovanými informáciami
                o digitálnom výberovom teste a nových funkciách systému.
              </p>
            </div>
          </article>

          <article class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="h-48 bg-gradient-to-r from-green-600 to-green-700 flex items-center justify-center">
              <div class="text-center text-white">
                <UIcon
                  name="i-lucide-message-square"
                  class="text-4xl mb-2"
                />
                <h3 class="text-lg font-semibold">
                  SPÄTNÁ VÄZBA
                </h3>
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center text-sm text-gray-500 mb-3">
                <UIcon
                  name="i-lucide-calendar"
                  class="mr-2"
                />
                7. máj 2025
              </div>
              <h4 class="text-xl font-semibold text-gray-900 mb-3">
                <a
                  href="#"
                  class="hover:text-blue-600"
                >Spätná väzba na služby verejného portálu CISŠS</a>
              </h4>
              <p class="text-gray-600">
                Vaša spätná väzba je pre nás dôležitá. Pomôžte nám zlepšiť služby
                verejného portálu vyplnením krátkeho dotazníka.
              </p>
            </div>
          </article>

          <article class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="h-48 bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center">
              <div class="text-center text-white">
                <UIcon
                  name="i-lucide-shield-check"
                  class="text-4xl mb-2"
                />
                <h3 class="text-lg font-semibold">
                  KOMPLEXNÉ RIEŠENIE
                </h3>
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center text-sm text-gray-500 mb-3">
                <UIcon
                  name="i-lucide-calendar"
                  class="mr-2"
                />
                1. jún 2024
              </div>
              <h4 class="text-xl font-semibold text-gray-900 mb-3">
                <a
                  href="#"
                  class="hover:text-blue-600"
                >Prínosy nového komplexného riešenia centrálneho informačného systému štátnej služby (CISŠS) pre občana a štátnu službu</a>
              </h4>
              <p class="text-gray-600">
                Zoznámte sa s výhodami nového systému, ktorý zefektívňuje komunikáciu
                medzi občanmi a štátnou správou.
              </p>
            </div>
          </article>

          <article class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="h-48 bg-gradient-to-r from-orange-600 to-orange-700 flex items-center justify-center">
              <div class="text-center text-white">
                <UIcon
                  name="i-lucide-zap"
                  class="text-4xl mb-2"
                />
                <h3 class="text-lg font-semibold">
                  EFEKTÍVNOSŤ
                </h3>
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center text-sm text-gray-500 mb-3">
                <UIcon
                  name="i-lucide-calendar"
                  class="mr-2"
                />
                1. jún 2024
              </div>
              <h4 class="text-xl font-semibold text-gray-900 mb-3">
                <a
                  href="#"
                  class="hover:text-blue-600"
                >Služby verejného portálu: zefektívnenie interakcie so služobnými úradmi</a>
              </h4>
              <p class="text-gray-600">
                Nové funkcie portálu umožňujú rýchlejšiu a jednoduchšiu komunikáciu
                so služobnými úradmi a zjednodušujú administratívne procesy.
              </p>
            </div>
          </article>
        </div>
      </section>

      <!-- Useful Links Section -->
      <section class="bg-white rounded-lg shadow-md p-8 mb-16">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">
          Užitočné odkazy
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <a
              href="#"
              class="block text-blue-600 hover:text-blue-700 hover:underline"
            >
              Úrad vlády Slovenskej republiky
            </a>
            <a
              href="#"
              class="block text-blue-600 hover:text-blue-700 hover:underline"
            >
              Národná agentúra pre sieťové a elektronické služby
            </a>
            <a
              href="#"
              class="block text-blue-600 hover:text-blue-700 hover:underline"
            >
              Ministerstvo investícií, regionálneho rozvoja a informatizácie SR
            </a>
          </div>
          <div class="space-y-4">
            <a
              href="#"
              class="block text-blue-600 hover:text-blue-700 hover:underline"
            >
              Elektronická Zbierka zákonov Slovenskej republiky
            </a>
            <a
              href="#"
              class="block text-blue-600 hover:text-blue-700 hover:underline"
            >
              Ústredný portál verejnej správy
            </a>
          </div>
        </div>
      </section>
    </div>

    <!-- Footer -->
    <footer class="bg-blue-900 text-white py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center">
          <div>
            <p class="text-sm">
              Dotazník spokojnosti
            </p>
          </div>
          <div>
            <p class="text-sm">
              Našli ste na stránke chybu?
            </p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const accessCode = ref('')
const searchQuery = ref('')

const startTest = () => {
  navigateTo(`/test?code=${accessCode.value}`)
}

useSeoMeta({
  title: 'Digitálny výberový test - Centrálny informačný systém štátnej služby',
  ogTitle: 'Digitálny výberový test - Centrálny informačný systém štátnej služby',
  description: 'Moderný digitálny systém na hodnotenie uchádzačov o pozície v štátnej správe Slovenskej republiky.',
  ogDescription: 'Moderný digitálny systém na hodnotenie uchádzačov o pozície v štátnej správe Slovenskej republiky.',
})
</script>

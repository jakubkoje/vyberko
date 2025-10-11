<template>
  <div class="min-h-screen bg-background flex items-center justify-center">
    <div class="container mx-auto py-8 max-w-2xl">
      <UCard>
        <div class="text-center py-8">
          <div class="mb-6">
            <UIcon
              name="i-lucide-check-circle-2"
              class="text-green-500 text-7xl mx-auto"
            />
          </div>
          
          <h1 class="text-3xl font-bold mb-4">
            Test bol úspešne dokončený!
          </h1>
          
          <p class="text-muted text-lg mb-8">
            Ďakujeme za absolvovanie digitálneho výberového testu. Vaše odpovede boli úspešne odoslané a uložené.
          </p>

          <UDivider class="my-8" />

          <div class="space-y-6 text-left">
            <div>
              <h2 class="text-xl font-semibold mb-3">
                Čo sa stane ďalej?
              </h2>
              <ul class="space-y-3 text-muted">
                <li class="flex items-start gap-3">
                  <UIcon
                    name="i-lucide-mail"
                    class="text-primary mt-1 flex-shrink-0"
                  />
                  <span>
                    <strong class="text-foreground">Email s potvrdením:</strong> 
                    Do 24 hodín dostanete email s potvrdením o prijatí vašich výsledkov.
                  </span>
                </li>
                <li class="flex items-start gap-3">
                  <UIcon
                    name="i-lucide-chart-bar"
                    class="text-primary mt-1 flex-shrink-0"
                  />
                  <span>
                    <strong class="text-foreground">Vyhodnotenie:</strong> 
                    Vaše výsledky budú vyhodnotené v priebehu 5 pracovných dní.
                  </span>
                </li>
                <li class="flex items-start gap-3">
                  <UIcon
                    name="i-lucide-phone"
                    class="text-primary mt-1 flex-shrink-0"
                  />
                  <span>
                    <strong class="text-foreground">Kontakt:</strong> 
                    V prípade úspešného absolvovania vás budeme kontaktovať s informáciami o ďalších krokoch výberového konania.
                  </span>
                </li>
              </ul>
            </div>

            <UAlert
              color="blue"
              variant="soft"
              title="Dôležité upozornenie"
              description="Svoje výsledky si môžete skontrolovať v emaili, ktorý vám pošleme. Uchovajte si ho pre prípad potreby."
              icon="i-lucide-info"
            />

            <div class="pt-4">
              <UButton
                to="/"
                color="primary"
                size="lg"
                block
              >
                <template #leading>
                  <UIcon name="i-lucide-home" />
                </template>
                Späť na hlavnú stránku
              </UButton>
            </div>
          </div>
        </div>
      </UCard>

      <div class="mt-6 text-center text-sm text-muted">
        <p>
          Máte otázky? Kontaktujte nás na 
          <a
            href="mailto:podpora@vyberko.sk"
            class="text-primary hover:underline"
          >
            podpora@vyberko.sk
          </a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Test dokončený - Digitálny výberový test',
  description: 'Test bol úspešne dokončený a odoslaný.'
})
</script>


<template>
  <div>
    <UHeader title="Nuxt UI" />
    <UContainer>
      <slot />
    </UContainer>
    <UFooter>
      <p class="text-muted text-sm">
        Copyright © {{ new Date().getFullYear() }}
      </p>
    </UFooter>
  </div>
</template>

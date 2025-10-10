<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    title="Recruitment access"
    icon="i-lucide-lock"
    @submit="onSubmit"
  />
</template>

<script lang="ts" setup>
import * as v from 'valibot'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
})

const fields = [{
  name: 'accessCode',
  type: 'text' as const,
  label: 'Access code',
  placeholder: 'Enter your access code',
  required: true,
}]

const schema = v.object({
  accessCode: v.pipe(v.string('Access code is required')),
})

type Schema = v.InferOutput<typeof schema>

async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log(event.data)
}
</script>

import { createSharedComposable } from '@vueuse/core'

const _useDashboard = () => {
  const route = useRoute()
  const router = useRouter()

  defineShortcuts({
    'g-h': () => router.push('/admin'),
    'g-sr': () => router.push('/admin/surveys'),
    'g-p': () => router.push('/admin/procedures'),
    'g-p-r': () => router.push('/admin/profile'),
  })
}

export const useDashboard = createSharedComposable(_useDashboard)

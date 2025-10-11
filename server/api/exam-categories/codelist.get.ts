import { examCategoriesCodelist } from '../../utils/examCategoriesCodelist'

export default defineEventHandler(async (event) => {
  return examCategoriesCodelist
})

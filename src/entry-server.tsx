import { RouterProvider, createMemoryHistory } from '@tanstack/react-router'
import { renderToString } from 'react-dom/server'
import { createRouter } from './router'

export async function render(url: string) {
  const router = createRouter()
  const history = createMemoryHistory({ initialEntries: [url] })
  router.update({ history })
  await router.load()
  
  const html = renderToString(<RouterProvider router={router} />)
  return html
}

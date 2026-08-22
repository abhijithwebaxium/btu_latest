import { RouterProvider } from '@tanstack/react-router'
import { hydrateRoot, createRoot } from 'react-dom/client'
import { createRouter } from './router'

const router = createRouter()

const rootElement = document.getElementById('root')!

if (rootElement.innerHTML.trim().length > 0) {
  hydrateRoot(rootElement, <RouterProvider router={router} />)
} else {
  createRoot(rootElement).render(<RouterProvider router={router} />)
}

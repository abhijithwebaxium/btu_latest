import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import React from 'react'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Bir Tikendrajit University (BTU) | Campus OS',
      },
      {
        name: 'description',
        content: 'Bir Tikendrajit University (BTU) evaluation and campus operations dashboard',
      },
      {
        name: 'theme-color',
        content: '#020617',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-slate-950 text-slate-100 font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}

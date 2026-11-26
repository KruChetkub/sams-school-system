/**
 * @file main.tsx
 * @description Application entry point for SAMS (School Attendance & Management System)
 * @author KruChet (https://github.com/KruChetkub)
 * @repository https://github.com/KruChetkub/sams-school-system
 * @copyright 2024-2026 KruChet (KruChetkub). All rights reserved.
 * Protected under the Thai Copyright Act B.E. 2537 and international copyright conventions.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { initClientSecurity } from './lib/security'
import './index.css'
import App from './App.tsx'

initClientSecurity()

// ล้างแคช Workbox Precache เก่าที่อาจค้างอยู่ในเบราว์เซอร์และทำให้หน้าเว็บไม่อัปเดต
if (typeof window !== 'undefined') {
  if ('caches' in window) {
    caches.keys().then(names => {
      for (const name of names) {
        if (name.includes('workbox-precache') || name.includes('vite-plugin-pwa')) {
          caches.delete(name).catch(() => {})
        }
      }
    }).catch(() => {})
  }

  // หากมีพารามิเตอร์ _v จากการบังคับล้างแคช ให้ลบออกจาก URL เพื่อความสะอาด
  if (window.location.search.includes('_v=')) {
    const cleanUrl = new URL(window.location.href)
    cleanUrl.searchParams.delete('_v')
    window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash)
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: true,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

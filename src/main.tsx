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

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)

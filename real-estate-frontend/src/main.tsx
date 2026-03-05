import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './app/query-client'
import { initAuth } from './app/init-auth'
import App from './App'
import './index.css'

// Fire auth check BEFORE rendering — but don't block the render.
// React renders immediately; App shows a spinner until isInitialized = true.
initAuth(); // ← intentionally NOT awaited

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)

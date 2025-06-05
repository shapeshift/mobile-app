import App from './App'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const Root: React.FC = () => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </>
  )
}

export default Root

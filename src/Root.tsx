import App from './App'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const queryClient = new QueryClient()

const Root: React.FC = () => {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <App />
        </SafeAreaProvider>
      </QueryClientProvider>
    </>
  )
}

export default Root

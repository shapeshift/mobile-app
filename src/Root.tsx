import App from './App'
import { SingletonHooksContainer } from 'react-singleton-hook'
import React from 'react'

// import does the polyfilling, needed for new URLSearchParams
import 'react-native-url-polyfill/auto'

const Root: React.FC = () => {
  return (
    <>
      <SingletonHooksContainer />
      <App />
    </>
  )
}

export default Root

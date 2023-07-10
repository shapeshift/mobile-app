import App from './App'
import { SingletonHooksContainer } from 'react-singleton-hook'
import React from 'react'

const Root: React.FC = () => {
  return (
    <>
      <SingletonHooksContainer />
      <App />
    </>
  )
}

export default Root

import {
  DEVELOP_URI,
  RELEASE_URI,
  SHAPESHIFT_PRIVATE_URI,
  SHAPESHIFT_URI,
} from 'react-native-dotenv'

export type Environment = {
  key: string
  title: string
  url: string
}

export const ENVIRONMENTS: Readonly<Readonly<Environment>[]> = Object.freeze([
  {
    key: 'prod',
    title: 'Production',
    url: SHAPESHIFT_URI,
  },
  {
    key: 'private',
    title: 'Production (Private)',
    url: SHAPESHIFT_PRIVATE_URI,
  },
  {
    key: 'dev',
    title: 'Development',
    url: DEVELOP_URI,
  },
  {
    key: 'pre-release',
    title: 'Pre-release',
    url: RELEASE_URI,
  },
  {
    key: 'localhost',
    title: 'Localhost',
    url: 'http://localhost:3000',
  },
  {
    key: 'android',
    title: 'Localhost (Android)',
    url: 'http://10.0.2.2:3000',
  },
])

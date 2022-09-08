# mobile-app
React Native WebView wrapper for app.shapeshift.com

# Native Environment Setup
To setup your local environment follow the [react-native environment setup](https://reactnative.dev/docs/environment-setup) and selecting "React Native CLI Quickstart"

#### For M1 users
It is simpler to install CocoaPods via brew rather than using Ruby. 
```
`brew install cocoapods`
```

# Local build and development
Install dependencies using `yarn install`

## iOS
Tested with Xcode 13.4 on macOS 12.5. You will also need CocoaPods installed


1. Copy .env file
```
cp .env.template .env
```

2. Start Metro
```
yarn start
```

3. Start the app
```
cd ios
pod install
yarn ios
```

## Android
Requires Android Studio. Follow the React Native Android setup instructions first.
```
yarn android
```


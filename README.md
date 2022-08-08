# mobile-app
React Native WebView wrapper for app.shapeshift.com

# Native Environment Setup
To setup your local environment follow the [react-native environment setup](https://reactnative.dev/docs/environment-setup) and selecting "React Native CLI Quickstart"

# Local build and development
Install dependencies using `yarn install`

## iOS
Tested with Xcode 13.4 on macOS 12.5. You will also need CocoaPods installed

1. Start Metro
```
yarn start
```

2. Start the app
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


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
## Tooling Requirements
1. `node` v16+
2. `yarn` v3
3. Android Studio / Xcode

### Yarn
To install `yarn` v3, run
```shell
corepack enable
corepack prepare yarn@3 --activate
```

run `yarn` to install dependencies

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

#### Publishing builds on ios

Currently we are manually building an archive in xCode to distribute the app.

1. Open xCode and open the ios/ folder.  You _must_ open the folder and not the project files.  If you dont see 2 projects in the file explorer (shapeshift and Pods) you haven't opened the directly correctly  
2. Ensure you are signed in to your developer account that has access to the Shapeshift Apple Store account (Xcode -> preferences -> Accounts)
3. Select any iOS device as the target
4. Select Product > Archive
5. If you archive builds correctly it will walk you through pushing this to the app store from there. 


## Android
Requires Android Studio. Follow the React Native Android setup instructions first.

Note: by default the android virtual device configured in Android Studio is under resourced. 
Increasing the RAM and Internal Storage may be required to succesffully run the app. 

If you see an error like the following, please attempt to increase the resources on the virtual device

> error Failed to install the app. Make sure you have the Android development environment set up: https://reactnative.dev/docs/environment-setup.
Error: Command failed: ./gradlew app:installDebug -PreactNativeDevServerPort=8081
Unable to install .../mobile-app/android/app/build/outputs/apk/debug/app-debug.apk
com.android.ddmlib.InstallException: Unknown failure: Exception occurred while executing 'install':
android.os.ParcelableException: java.io.IOException: Requested internal only, but not enough space

#### To start the app:

```
yarn android
```

#### Publishing builds on Android
You will need to obtain signing artifacts from someone in order to push builds. 

1. Once you have successfully set up android studio per the documentation above you can proceed. Make sure you have opened the ./android folder as the root.
2. In android studio, select Build -> Generate Signed Bundle / APK
3. Select Android App Bundle and select the keystore you have obtained
4. Select a `release build` and click Finish. 
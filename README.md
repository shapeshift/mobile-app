# mobile-app
React Native WebView wrapper for app.shapeshift.com

# Native Environment Setup
To setup your local environment follow the [react-native environment setup](https://reactnative.dev/docs/set-up-your-environment)

#### For M1 users
It is simpler to install CocoaPods via brew rather than using Ruby. 
```
`brew install cocoapods`
```

# Local build and development
## Tooling Requirements
1. `node` v18+
2. `yarn` v3
3. Android Studio / Xcode

### Yarn
To install `yarn` v3, run
```shell
corepack enable
corepack prepare yarn@3 --activate
```

Run `yarn` to install dependencies

## iOS
Tested with Xcode 13.4 on macOS 12.5. You will also need CocoaPods installed

1. Copy .env file
```
cp .env.template .env
```

2. Start Metro
```
yarn start
# add --reset-cache to wipe metro cache (required for .env changes)
```
3. Start the app
```
cd ios
nvm use
yarn install
pod install
yarn ios
# add --device 'iPhone' (replacing iPhone with your device name) to run on device. add --simulator 'iPhone 14' to specify iPhone 14 simulator. xcode also has these capabilities
```

### Publishing builds on ios

Currently we are manually building an archive in xCode to distribute the app.

1. Open xCode and open the ios/ folder.  You _must_ open the folder and not the project files.  If you dont see 2 projects in the file explorer (shapeshift and Pods) you haven't opened the directly correctly  
2. Ensure you are signed in to your developer account that has access to the Shapeshift Apple Store account (Xcode -> preferences -> Accounts)
3. Select any iOS device as the target
4. Select Product > Archive to create the app archive.
5. If your archive builds correctly it will walk you through pushing this to the app store from there. 

### Running on device with local web
1. Run web on your local machine as usual

2. install ngrok
```
brew install ngrok
```
1. Create a free account here https://ngrok.com/ and obtain your auth token
4. Configure ngrok with your token
```
ngrok config add-authtoken YOUR_TOKEN
```
3. run ngrok, note the public `Forwarding` domain listed
```
ngrok http 3000 # substitute port if necessary
```
4. Modify `.env` to point the WebView at the ngrok endpoint created above
```
SHAPESHIFT_URI=https://523d-135-134-162-133.ngrok.io # example ngrok domain
```
5. Run the app on your device from Xcode _or_ use the yarn script:
```
yarn ios:device
```
for now, the above runs `node_modules/.bin/react-native run-ios --device 'iPhone'` - substitute the name of your device for iPhone
#### __Notes__
- you may need to kill and reload the app after it's been completely loaded to get it to source content from metro
- you may need to remove the line `messageManager.webviewRef?.reload()` in the useKeepAliveHook if the device has trouble downloading bundle.js before getting whacked.
- you will need to manually add your ngrok domain to the `navigationFilter` to prevent opening in a browser. dev flag/mode?
- as of 10/6: in your local web, move the entire contents of `react-app-rewired/headers/csps` out of their normal place and full restart web (yarn dev)

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

### To start the app:

```
yarn android
```

### Debugging the webview (Android Only)

To debug the webview:

- Run metro and the build for iOS / Android (see iOS and Android sections below)
- Run `chrome://inspect/#devices` and click "Inspect" on the remote target

![Remote Target Inspect](https://github.com/shapeshift/mobile-app/assets/17035424/7ede8055-9165-43e9-b54d-0862ae869728)

### Troubleshooting Android

> `Cannot run program "node": error=2, No such file or directory`

This is usually fixed by running Android directly from the project cwd. On osx, this is done with `open -a /Applications/Android\ Studio.app`

> `Unable to load script.Make sure you are either running a Metro server or that your bundle 'index.android.bundle' is packaged correctly for release`

This is usually fixed by running metro directly within the integrated terminal of Android studio with `yarn start`, then `a` for Android.

### Publishing builds on Android
You will need to obtain signing artifacts from someone in order to push builds. 

1. Once you have successfully set up android studio per the documentation above you can proceed. Make sure you have opened the ./android folder as the root.
2. In android studio, select Build -> Generate Signed Bundle / APK
3. Select Android App Bundle and select the keystore you have obtained
4. Select a `release build` and click Finish. 

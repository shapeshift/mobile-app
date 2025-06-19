# Expo setup 
If needed, there is a guide depending on what you want to build/launch in the [Expo documentation](https://docs.expo.dev/get-started/set-up-your-environment/)

# Local build and development
## Tooling Requirements
1. `node` v18+
2. `yarn` v3
3. Android Studio / Xcode
3. The `Expo Go` application on your mobile phone

### Yarn
To install `yarn`, run
```shell
npm install --global yarn
```

Run `yarn` to install dependencies

## Launching the app

- Run Expo 
```
yarn start
```
- Open Expo Go or scan the QR code.
- You can also open the devtool console by typing `d` in the terminal

## Reset the cache
If you changed some environment variable, you might need to reset the cache:

```
npx expo start --reset-cache
```

## Running on Expo Go with local web
- Run web, copy the lan IP e.g `192.168.x.y`
- Update your `EXPO_PUBLIC_LOCAL_URI` in the .env with the related IP
- Run the mobile app using this command (note the --reset-cache option, it's necessary for Metro to reload the .env file):
```
npx expo start --reset-cache
```
- Install Expo Go
- Launch ShapeShift by scanning the QR code
- Select the `localhost` environment in the settings
- The hotreloading should work as expected


## Run the iOS build in a simulator
1. There is an expo command to run the iOS app:
```
yarn ios
```
2. If you are struggling launching the simulator, you might want to use the prebuild command which is updating native folders:
```
yarn prebuild
```

## Run the Android build in a simulator
1. There is an expo command to run the iOS app:
```
yarn android
```

## Pushing builds to EAS
- Install EAS:
```shell
npm install -g eas-cli
```
- Send both apps:
```shell
eas build
```

## Deploying a new version

### Autoincrement
EAS is supposed to support builds auto increment, every time we submit a build, the patch version should be incremented.

### Major or minor versions

- Update the `appVersion` and `version` fields of the `app.json` file
- run `npx expo prebuild` to build both android and ios bundles and update the versions
- and then deploy a build to eas using `eas build`

### Updating native files
If we add some native library, we will need to avoid the old applications to receive the Over-The-Air (OTA) updates:
- The process is the same as updating to a major or minor version, but you also need to update the `runtimeVersion`, this is used for Expo to check if the `runtimeVersion` of the update is the same than the current OTA, if it differs, the application will not take the OTA avoiding any crash issues because of missing native files.

### Allow for OPS to test before releasing an OTA
The more practical way is to update the `runtimeVersion` and push this particular build to android testing channels and flightests, but this will require a store update.

In the future, if we see that it would be more practical to have a dedicated channel, it would means that OPS team would need to keep the operations app on their phone, we could do a release channel build and update them as OTAs, then rebuild using the production channel, but as far as I know, iPhones can't install both apps at the same time...

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
- Update the `version` field in the `app.json` file to the new version
- run `npx expo prebuild` to build both android and ios bundles and update the versions
- and then deploy a build to eas using `eas build`

## Getting native files to test builds locally using an emulator

- Make sure you have android studio installed, with an emulator, same for iOS with xcode
- First run `npx expo prebuild`
- Then `npx expo start`
- Hit `i` or `a` depending on which emulator you want to run

## Push a workflow job manually
We can launch workflows to deploy an app without relying on the CI:

`npx eas-cli@latest workflow:run .eas/workflows/build-and-deploy.yml`

It can be useful if we want the operation team to test a specific version before we merge on main.

### Autoincrement
EAS supports auto incrementing builds. Every time we submit a build, the patch version will be automatically incremented.

### Major or minor versions

1. Update the `appVersion` and `version` fields of the `app.json` file
2. run `npx expo prebuild` to build both android and ios bundles and update the versions
3. and then deploy a build to eas using `eas build`

### Updating native files
If we add some native library, we will need to prevent the old applications from receiving the Over-The-Air (OTA) updates:
- The process is the same as updating to a major or minor version, but you also need to update the `runtimeVersion`, which is used by Expo to check if the `runtimeVersion` of the update is the same as the current OTA. If it differs, the application will not accept the OTA to avoid crash issues due to missing native files.

### Pushing Over-The-Air Updates (OTAs)
To deliver an OTA for the current version:
```
eas update --channel production --message "[message]"
```
We don't have any other channel than production.
It will push OTAs to the devices having the current `runtimeVersion` installed, if users have old `runtimeVersion` they won't get the update (it means we probably updated some native files or anything that require a full release)

### Allow for OPS to test before releasing an OTA
The more practical way is to update the `runtimeVersion` and push this particular build to android testing channels and flightests, but this will require a store update.

In the future, if we see that it would be more practical to have a dedicated channel, it would means that OPS team would need to keep the operations app on their phone, we could do a release channel build and update them as OTAs, then rebuild using the production channel, but as far as I know, iPhones can't install both apps at the same time...

### Releasing on the Solana dApp store
Prepare the keypair of the DAO's wallet managing the app publish/release NFTs (We did mint them following [this documentation](https://docs.solanamobile.com/dapp-publishing/publisher-and-app-nft))
1. You need Android Studio installed on your computer, as long as the build tools.
2. Verify that the app is configured accordingly by checking the `config.yaml` file and:
```bash
npx @solana-mobile/dapp-store-cli validate -k keypair.json -b ~/Library/Android/sdk/build-tools/35.0.0
```
3. Download the APK from our Expo dashboard (the build using the solana-dapp configuration profile), add it to the `solanaStoreMedia` folder named as `shapeshift-vX.X.X-signed.apk`
4. Create the release and submit it using [this link](https://docs.solanamobile.com/dapp-publishing/submit).

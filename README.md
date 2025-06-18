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

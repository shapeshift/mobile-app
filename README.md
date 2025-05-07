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

## iOS

1. Copy .env file
```
cp .env.template .env
```

2. There is an expo command to run the iOS app:
```
yarn ios
```

### Reset the cache
If you changed some environment variable, you might need to reset the cache:

```
npx expo start --reset-cache
```

### Running on Expo Go with local web
- Run web, select the lan IP
- Update your `EXPO_PUBLIC_LOCAL_URI` in the .env with the related IP
- Run the mobile app using this command (note the --reset-cache option, it's necessary for Metro to reload the .env file):
```
npx expo start --reset-cache
```
- Install Expo Go
- Launch ShapeShift by scanning the QR code
- Select the `local` environment in the settings
- The hotreloading should work as expected

### Pushing builds to EAS
- Install EAS:
```shell
npm install -g eas-cli
```
- Send both apps:
```shell
eas build
```

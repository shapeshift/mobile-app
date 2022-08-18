import React from 'react'
import { Text, View, TouchableOpacity, ImageBackground } from 'react-native'
import { ErrorIcon } from './ErrorIcon'
import { styles } from './styles'

export type ErrorPageProps = { onTryAgain: () => unknown }

const ErrorPage: React.FC<ErrorPageProps> = props => {
  return (
    <View style={[styles.container, styles.flexcol, styles.centerContents, styles.fullHeight]}>
      <ImageBackground
        resizeMode='cover'
        style={styles.imageBackground}
        source={require('./no-connection-bg.jpg')}
      >
        <View style={[styles.innerErrorContainer]}>
          <ErrorIcon style={[styles.errorIcon, styles['mb-md']]} />
          <Text style={[styles.header, styles['mb-md'], styles.textCenter]}>Unable to Connect</Text>
          <Text style={[styles.body, styles['mb-md'], styles.textCenter]}>
            Make sure Wi-Fi or mobile data is turned on and try again.
          </Text>
          <TouchableOpacity style={styles.button} onPress={props.onTryAgain}>
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  )
}

export default ErrorPage

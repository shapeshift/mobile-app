import React from 'react'
import { Button, SafeAreaView, Text, View } from 'react-native'
import { styles } from './styles'

export type ErrorPageProps = { onTryAgain: () => unknown }

const ErrorPage: React.FC<ErrorPageProps> = props => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.container, styles.flexcol]}>
        <View>
          <Text style={styles.errorText}>Something went wrong</Text>
        </View>
        <View style={styles.flexthree}>
          <Button title='Try Again' onPress={props.onTryAgain} />
        </View>
      </View>
    </SafeAreaView>
  )
}

export default ErrorPage

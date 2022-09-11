import React from 'react'
import { StyleSheet, View } from 'react-native'

export const Separator = () => <View style={styles.separator} />

const styles = StyleSheet.create({
  separator: {
    height: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#3761F9',
    marginVertical: 8,
  },
})

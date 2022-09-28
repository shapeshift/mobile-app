import React from 'react'
import { Alert, Button, FlatList, Modal, Pressable, Text, View } from 'react-native'
import {
  DEVELOP_URI,
  RELEASE_URI,
  SHAPESHIFT_PRIVATE_URI,
  SHAPESHIFT_URI,
} from 'react-native-dotenv'
import { setItemAsync } from 'expo-secure-store'
import { styles } from '../styles'
import { Separator } from './Separator'

type Environment = {
  key: string
  title: string
  url: string
}

const ENVIRONMENTS: Environment[] = [
  {
    key: 'prod',
    title: 'Production',
    url: SHAPESHIFT_URI,
  },
  {
    key: 'private',
    title: 'Production (Private)',
    url: SHAPESHIFT_PRIVATE_URI,
  },
  {
    key: 'dev',
    title: 'Development',
    url: DEVELOP_URI,
  },
  {
    key: 'pre-release',
    title: 'Pre-release',
    url: RELEASE_URI,
  },
  {
    key: 'localhost',
    title: 'Localhost',
    url: 'http://localhost:3000',
  },
  {
    key: 'android',
    title: 'Localhost (Android)',
    url: 'http://10.0.2.2:3000',
  },
]

type PressFn = (url: string) => void

const ListItem = (props: Environment & { onPress: PressFn }) => {
  return (
    <View>
      <Button title={props.title} onPress={() => props.onPress(props.url)} />
    </View>
  )
}

export const DeveloperModeModal = (props: {
  visible: boolean
  onClose: () => void
  onSelect: PressFn
}) => {
  const { visible, onClose, onSelect } = props
  return visible ? (
    <Modal animationType='slide' transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalView}>
        <Text style={styles.modalHeader}>Select Environment</Text>
        <FlatList
          data={ENVIRONMENTS}
          renderItem={({ item }) => (
            <ListItem {...item} onPress={url => (onSelect(url), onClose())} />
          )}
          ItemSeparatorComponent={Separator}
        />
        <Pressable
          style={styles.button}
          onPress={async () => {
            try {
              await setItemAsync('mnemonic', 'all all all all all all all all all all all all')
              Alert.alert('Mnemonic Saved')
            } catch (e) {
              Alert.alert('Save failed')
            }
          }}
        >
          <Text style={styles.textStyle}>Create a mnemonic for import</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.buttonClose]} onPress={onClose}>
          <Text style={styles.textStyle}>Close</Text>
        </Pressable>
      </View>
    </Modal>
  ) : null
}

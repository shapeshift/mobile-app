import React from 'react'
import { Alert, Button, FlatList, Modal, Pressable, Text, View } from 'react-native'
import { setItemAsync } from 'expo-secure-store'
import { styles } from '../styles'
import { Separator } from './Separator'

type Environment = {
  key: string
  title: string
  url: string
}

const ENVIRONMENTS: Environment[] = [
  /**
   * production environments
   */
  {
    key: 'app',
    title: 'app',
    url: process.env.EXPO_PUBLIC_SHAPESHIFT_URI,
  },
  {
    key: 'private',
    title: 'private',
    url: process.env.EXPO_PUBLIC_SHAPESHIFT_PRIVATE_URI,
  },
  {
    key: 'release',
    title: 'release',
    url: process.env.EXPO_PUBLIC_RELEASE_URI,
  },
  /**
   * shared development environments
   */
  {
    key: 'dev',
    title: 'develop',
    url: process.env.EXPO_PUBLIC_DEVELOP_URI,
  },
  {
    key: 'yeet',
    title: 'yeet',
    url: process.env.EXPO_PUBLIC_YEET_URI,
  },
  /**
   * individual ephemeral environments
   */
  {
    key: 'cafe',
    title: 'cafe',
    url: process.env.EXPO_PUBLIC_CAFE_URI,
  },
  {
    key: 'beard',
    title: 'beard',
    url: process.env.EXPO_PUBLIC_BEARD_URI,
  },
  {
    key: 'gome',
    title: 'gome',
    url: process.env.EXPO_PUBLIC_GOME_URI,
  },
  {
    key: 'juice',
    title: 'juice',
    url: process.env.EXPO_PUBLIC_JUICE_URI,
  },
  {
    key: 'wood',
    title: 'wood',
    url: process.env.EXPO_PUBLIC_WOOD_URI,
  },
  {
    key: 'neo',
    title: 'neo',
    url: process.env.EXPO_PUBLIC_NEO_URI,
  },
  {
    key: 'localhost',
    title: 'localhost',
    url: process.env.EXPO_PUBLIC_LOCAL_URI,
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

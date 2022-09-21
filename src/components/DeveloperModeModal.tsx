import React from 'react'
import { Alert, Button, FlatList, Modal, Pressable, Text, View } from 'react-native'
import { setItemAsync } from 'expo-secure-store'
import { Environment, ENVIRONMENTS } from '../lib/environments'
import { styles } from '../styles'
import { Separator } from './Separator'

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

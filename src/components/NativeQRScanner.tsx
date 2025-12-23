import React from 'react'
import { Modal, Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type NativeQRScannerProps = {
  visible: boolean
  onClose: () => void
  onScanSuccess: (data: string) => void
}

export const NativeQRScanner = ({ visible, onClose, onScanSuccess }: NativeQRScannerProps) => {
  const [permission, requestPermission] = useCameraPermissions()
  const insets = useSafeAreaInsets()
  const [hasScanned, setHasScanned] = React.useState(false)

  // Reset scan state when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setHasScanned(false)
    }
  }, [visible])

  if (!visible) {
    return null
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (hasScanned) return
    setHasScanned(true)
    onScanSuccess(data)
  }

  const renderContent = () => {
    if (!permission) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator color='#FFFFFF' size='large' />
          <Text style={styles.statusText}>Loading camera...</Text>
        </View>
      )
    }

    if (!permission.granted) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.statusText}>Camera access is required to scan QR codes</Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </Pressable>
        </View>
      )
    }

    return (
      <CameraView
        style={styles.camera}
        facing='back'
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.scanHint}>Position QR code within the frame</Text>
        </View>
      </CameraView>
    )
  }

  return (
    <Modal
      animationType='slide'
      presentationStyle='pageSheet'
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>
        <View style={styles.cameraContainer}>{renderContent()}</View>
      </View>
    </Modal>
  )
}

const CORNER_SIZE = 30
const CORNER_THICKNESS = 4
const SCAN_AREA_SIZE = 250

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181c27',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d3748',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2d3748',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  permissionButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3761F9',
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: '#3761F9',
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: '#3761F9',
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderColor: '#3761F9',
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderColor: '#3761F9',
  },
  scanHint: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
})

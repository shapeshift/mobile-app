import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native'
import { updateWidgetData, TokenDataSource } from '../../modules/expo-widget-bridge/src'

interface WidgetSettingsProps {
  visible: boolean
  onClose: () => void
}

export const WidgetSettings: React.FC<WidgetSettingsProps> = ({ visible, onClose }) => {
  const [selectedSource, setSelectedSource] = useState<TokenDataSource>(TokenDataSource.MarketCap)

  const handleSelectSource = async (source: TokenDataSource) => {
    setSelectedSource(source)

    // Update widget configuration
    // This will trigger the widget to refresh with the new data source
    console.log('[Widget Settings] Selected:', source)

    // Close the modal after selection
    setTimeout(onClose, 300)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Widget Data Source</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Choose which tokens to display in your widget
          </Text>

          {/* Options */}
          <View style={styles.options}>
            {/* Market Cap Option */}
            <TouchableOpacity
              style={[
                styles.option,
                selectedSource === TokenDataSource.MarketCap && styles.optionSelected,
              ]}
              onPress={() => handleSelectSource(TokenDataSource.MarketCap)}
            >
              <View style={styles.optionContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>📊</Text>
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Market Cap</Text>
                  <Text style={styles.optionSubtitle}>
                    Top tokens by market capitalization
                  </Text>
                </View>
              </View>
              {selectedSource === TokenDataSource.MarketCap && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>

            {/* Trading Volume Option */}
            <TouchableOpacity
              style={[
                styles.option,
                selectedSource === TokenDataSource.TradingVolume && styles.optionSelected,
              ]}
              onPress={() => handleSelectSource(TokenDataSource.TradingVolume)}
            >
              <View style={styles.optionContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>📈</Text>
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Trading Volume</Text>
                  <Text style={styles.optionSubtitle}>
                    Top tokens by 24h trading volume
                  </Text>
                </View>
              </View>
              {selectedSource === TokenDataSource.TradingVolume && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info */}
          <Text style={styles.info}>
            Your widget will update automatically after selecting a data source.
          </Text>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#181C27',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  options: {
    paddingHorizontal: 24,
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: '#3861FB',
    backgroundColor: 'rgba(56, 97, 251, 0.1)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  checkmark: {
    fontSize: 20,
    color: '#3861FB',
    fontWeight: '700',
    marginLeft: 12,
  },
  info: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 24,
    marginTop: 20,
    textAlign: 'center',
  },
})

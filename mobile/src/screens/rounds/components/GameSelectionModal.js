import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';

const GAME_FORMATS = [
  {
    id: 'skins',
    name: 'Skins',
    icon: '💰',
    description: 'Each hole is worth a skin. Ties carry over to next hole.',
    settings: {
      carryOver: { label: 'Carry over ties', default: true, type: 'boolean' },
      skinValue: { label: 'Value per skin', default: '5', type: 'number', prefix: '$' },
    },
  },
  {
    id: 'nassau',
    name: 'Nassau',
    icon: '🏌️',
    description: 'Three separate matches: Front 9, Back 9, and Overall 18.',
    settings: {
      frontBet: { label: 'Front 9 bet', default: '2', type: 'number', prefix: '$' },
      backBet: { label: 'Back 9 bet', default: '2', type: 'number', prefix: '$' },
      overallBet: { label: 'Overall bet', default: '2', type: 'number', prefix: '$' },
      presses: { label: 'Allow presses', default: true, type: 'boolean' },
    },
  },
  {
    id: 'stableford',
    name: 'Stableford',
    icon: '🎯',
    description: 'Points-based scoring. More points for better scores.',
    settings: {
      eaglePoints: { label: 'Eagle or better', default: '4', type: 'number', suffix: ' pts' },
      birdiePoints: { label: 'Birdie', default: '3', type: 'number', suffix: ' pts' },
      parPoints: { label: 'Par', default: '2', type: 'number', suffix: ' pts' },
      bogeyPoints: { label: 'Bogey', default: '1', type: 'number', suffix: ' pts' },
      useHandicaps: { label: 'Use handicaps', default: true, type: 'boolean' },
    },
  },
  {
    id: 'match',
    name: 'Match Play',
    icon: '⚔️',
    description: 'Win holes to win the match. Most holes won takes it.',
    settings: {
      useHandicaps: { label: 'Use handicaps', default: true, type: 'boolean' },
      concessionAllowed: { label: 'Allow concessions', default: true, type: 'boolean' },
    },
  },
  {
    id: 'stroke',
    name: 'Stroke Play',
    icon: '📊',
    description: 'Traditional scoring. Lowest total score wins.',
    settings: {
      useHandicaps: { label: 'Use net scoring', default: false, type: 'boolean' },
    },
  },
];

const GameSelectionModal = ({ visible, onClose, onSelectGame, players }) => {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [gameSettings, setGameSettings] = useState({});

  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    // Initialize settings with defaults
    const defaultSettings = {};
    Object.entries(format.settings).forEach(([key, config]) => {
      defaultSettings[key] = config.default;
    });
    setGameSettings(defaultSettings);
  };

  const updateSetting = (key, value) => {
    setGameSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleStartGame = () => {
    if (!selectedFormat) {
      Alert.alert('Select Format', 'Please select a game format');
      return;
    }

    const gameConfig = {
      format: selectedFormat.id,
      name: selectedFormat.name,
      settings: gameSettings,
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        handicap: p.handicap,
      })),
      startedAt: new Date().toISOString(),
    };

    onSelectGame(gameConfig);
    onClose();
  };

  const renderSettingInput = (key, config) => {
    const value = gameSettings[key];

    if (config.type === 'boolean') {
      return (
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{config.label}</Text>
          <Switch
            value={value === true || value === 'true'}
            onValueChange={(val) => updateSetting(key, val)}
            trackColor={{ false: '#ccc', true: '#81c784' }}
            thumbColor={value ? '#2e7d32' : '#f4f3f4'}
          />
        </View>
      );
    }

    if (config.type === 'number') {
      return (
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{config.label}</Text>
          <View style={styles.numberInputContainer}>
            {config.prefix && <Text style={styles.inputPrefix}>{config.prefix}</Text>}
            <TextInput
              style={styles.numberInput}
              value={String(value)}
              onChangeText={(text) => updateSetting(key, text)}
              keyboardType="numeric"
              placeholder="0"
            />
            {config.suffix && <Text style={styles.inputSuffix}>{config.suffix}</Text>}
          </View>
        </View>
      );
    }

    return null;
  };

  const renderFormatCard = (format) => {
    const isSelected = selectedFormat?.id === format.id;

    return (
      <TouchableOpacity
        key={format.id}
        style={[styles.formatCard, isSelected && styles.formatCardSelected]}
        onPress={() => handleFormatSelect(format)}
        activeOpacity={0.7}
      >
        <View style={styles.formatHeader}>
          <Text style={styles.formatIcon}>{format.icon}</Text>
          <View style={styles.formatInfo}>
            <Text style={[styles.formatName, isSelected && styles.formatNameSelected]}>
              {format.name}
            </Text>
            <Text style={[styles.formatDescription, isSelected && styles.formatDescriptionSelected]}>
              {format.description}
            </Text>
          </View>
          {isSelected && (
            <View style={styles.checkCircle}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          )}
        </View>

        {isSelected && (
          <View style={styles.settingsContainer}>
            <View style={styles.settingsDivider} />
            {Object.entries(format.settings).map(([key, config]) => (
              <View key={key}>
                {renderSettingInput(key, config)}
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Game Format</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Playing with {players.length} players
            </Text>

            {GAME_FORMATS.map(renderFormatCard)}

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>💡 Tips</Text>
              <Text style={styles.infoText}>
                • Skins: Great for keeping everyone engaged on every hole{'\n'}
                • Nassau: Classic format for competitive rounds{'\n'}
                • Stableford: Rewards aggressive play, less penalty for bad holes{'\n'}
                • Match Play: Head-to-head competition{'\n'}
                • Stroke Play: Traditional scoring for serious rounds
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.startButton, !selectedFormat && styles.startButtonDisabled]}
              onPress={handleStartGame}
              disabled={!selectedFormat}
            >
              <Text style={styles.startButtonText}>
                Start {selectedFormat?.name || 'Game'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
    color: '#666',
  },
  scrollContent: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  formatCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formatCardSelected: {
    borderColor: '#2e7d32',
    backgroundColor: '#fff',
  },
  formatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formatIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  formatInfo: {
    flex: 1,
  },
  formatName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  formatNameSelected: {
    color: '#2e7d32',
  },
  formatDescription: {
    fontSize: 14,
    color: '#666',
  },
  formatDescriptionSelected: {
    color: '#555',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsContainer: {
    marginTop: 16,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputPrefix: {
    fontSize: 15,
    color: '#666',
    marginRight: 4,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 15,
    minWidth: 60,
    textAlign: 'center',
  },
  inputSuffix: {
    fontSize: 15,
    color: '#666',
    marginLeft: 4,
  },
  infoSection: {
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  startButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default GameSelectionModal;
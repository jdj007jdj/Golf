import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { API_CONFIG } from '../../config/api';

const SettingsScreen = ({ navigation }) => {
  const { user, logout, token } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // User Profile Settings
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // App Preferences - initialize from context
  const [measurementSystem, setMeasurementSystem] = useState(settings.measurementSystem);
  const [defaultTeeBox, setDefaultTeeBox] = useState(settings.defaultTeeBox);
  const [showPutts, setShowPutts] = useState(settings.showPutts);
  const [autoAdvanceHole, setAutoAdvanceHole] = useState(settings.autoAdvanceHole);
  const [keepScreenOn, setKeepScreenOn] = useState(settings.keepScreenOn);
  
  // Scorecard Display Options - initialize from context
  const [showHoleDistance, setShowHoleDistance] = useState(settings.scorecard?.showHoleDistance ?? true);
  const [showHandicapIndex, setShowHandicapIndex] = useState(settings.scorecard?.showHandicapIndex ?? true);
  const [showQuickScoreButtons, setShowQuickScoreButtons] = useState(settings.scorecard?.showQuickScoreButtons ?? true);
  const [showHoleProgress, setShowHoleProgress] = useState(settings.scorecard?.showHoleProgress ?? true);
  const [showScoreSummary, setShowScoreSummary] = useState(settings.scorecard?.showScoreSummary ?? true);
  const [showAchievementNotifications, setShowAchievementNotifications] = useState(settings.scorecard?.showAchievementNotifications ?? true);
  const [showSmartClubTracking, setShowSmartClubTracking] = useState(settings.scorecard?.showSmartClubTracking ?? true);
  
  // Theme Preferences (preparing for future dark mode)
  const [theme, setTheme] = useState(settings.theme);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [handicap, setHandicap] = useState(settings.handicap?.toString() || '');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Settings are already loaded from context
      // Just ensure user profile data is set
      if (user) {
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setEmail(user.email || '');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      const newSettings = {
        measurementSystem,
        defaultTeeBox,
        showPutts,
        autoAdvanceHole,
        keepScreenOn,
        theme,
        notificationsEnabled,
        handicap: handicap ? parseFloat(handicap) : null,
        scorecard: {
          showHoleDistance,
          showHandicapIndex,
          showQuickScoreButtons,
          showHoleProgress,
          showScoreSummary,
          showClubSelection: false, // Future feature
          showAchievementNotifications,
          showSmartClubTracking,
        },
      };
      
      const success = await updateSettings(newSettings);
      
      if (success) {
        // Update user profile if changed
        if (token && (firstName !== user?.firstName || lastName !== user?.lastName || handicap)) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
            
            const profileData = {
              firstName,
              lastName,
              handicap: handicap ? parseFloat(handicap) : null,
            };
            
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USERS.PROFILE}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(profileData),
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              console.error('Failed to update profile:', response.status);
            }
          } catch (error) {
            console.error('Error updating profile:', error);
          }
        }
        
        Alert.alert('Success', 'Settings saved successfully');
      } else {
        Alert.alert('Error', 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        },
      ]
    );
  };

  const renderSectionHeader = (title) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const renderSettingRow = (label, value, onPress = null) => (
    <TouchableOpacity 
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.settingLabel}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={styles.settingValue}>{value}</Text>
      ) : value}
    </TouchableOpacity>
  );

  const renderSwitch = (label, value, onValueChange, subtitle = null) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLabelContainer}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E0E0E0', true: '#81C784' }}
        thumbColor={value ? '#2E7D32' : '#F5F5F5'}
      />
    </View>
  );

  const renderTextInput = (label, value, onChangeText, placeholder, keyboardType = 'default') => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor="#999"
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity onPress={saveSettings} disabled={isSaving}>
          <Text style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        {renderSectionHeader('User Profile')}
        <View style={styles.section}>
          {renderTextInput('First Name', firstName, setFirstName, 'Enter first name')}
          {renderTextInput('Last Name', lastName, setLastName, 'Enter last name')}
          {renderTextInput('Email', email, setEmail, 'Enter email', 'email-address')}
          {renderTextInput('Handicap', handicap, setHandicap, 'Enter handicap (optional)', 'decimal-pad')}
        </View>

        {/* Measurement System Section */}
        {renderSectionHeader('Units & Measurements')}
        <View style={styles.section}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segment, measurementSystem === 'imperial' && styles.segmentActive]}
              onPress={() => setMeasurementSystem('imperial')}
            >
              <Text style={[styles.segmentText, measurementSystem === 'imperial' && styles.segmentTextActive]}>
                Imperial (yards)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, measurementSystem === 'metric' && styles.segmentActive]}
              onPress={() => setMeasurementSystem('metric')}
            >
              <Text style={[styles.segmentText, measurementSystem === 'metric' && styles.segmentTextActive]}>
                Metric (meters)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Golf Preferences Section */}
        {renderSectionHeader('Golf Preferences')}
        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>Default Tee Box</Text>
          <View style={styles.teeBoxContainer}>
            {['red', 'white', 'blue', 'black'].map((tee) => (
              <TouchableOpacity
                key={tee}
                style={[styles.teeBoxOption, defaultTeeBox === tee && styles.teeBoxActive]}
                onPress={() => setDefaultTeeBox(tee)}
              >
                <Text style={[styles.teeBoxText, defaultTeeBox === tee && styles.teeBoxTextActive]}>
                  {tee.charAt(0).toUpperCase() + tee.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {renderSwitch('Track Putts', showPutts, setShowPutts, 'Show putt entry on scorecard')}
          {renderSwitch('Auto-advance Hole', autoAdvanceHole, setAutoAdvanceHole, 'Move to next hole after scoring')}
        </View>

        {/* Scorecard Display Section */}
        {renderSectionHeader('Scorecard Display')}
        <View style={styles.section}>
          {renderSwitch('Hole Distance', showHoleDistance, setShowHoleDistance, 'Show distance to pin on each hole')}
          {renderSwitch('Handicap Index', showHandicapIndex, setShowHandicapIndex, 'Show hole difficulty rating')}
          {renderSwitch('Quick Score Buttons', showQuickScoreButtons, setShowQuickScoreButtons, 'Show birdie/par/bogey buttons')}
          {renderSwitch('Hole Progress Bar', showHoleProgress, setShowHoleProgress, 'Show completed holes at bottom')}
          {renderSwitch('Score Summary', showScoreSummary, setShowScoreSummary, 'Show running total and score to par')}
          {renderSwitch('Achievement Notifications', showAchievementNotifications, setShowAchievementNotifications, 'Show milestone alerts during rounds')}
          {renderSwitch('Smart Club Tracking', showSmartClubTracking, setShowSmartClubTracking, 'Track and recommend clubs during play')}
        </View>

        {/* App Preferences Section */}
        {renderSectionHeader('App Preferences')}
        <View style={styles.section}>
          {renderSwitch('Keep Screen On', keepScreenOn, setKeepScreenOn, 'Prevent screen timeout during rounds')}
          {renderSwitch('Notifications', notificationsEnabled, setNotificationsEnabled)}
          
          <Text style={styles.subsectionTitle}>Theme (Coming Soon)</Text>
          <View style={styles.themeInfo}>
            <Text style={styles.themeText}>Dark mode will be available in a future update</Text>
          </View>
        </View>

        {/* Account Section */}
        {renderSectionHeader('Account')}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  saveButton: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#999999',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 16,
    color: '#666666',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1A1A1A',
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  segmentActive: {
    backgroundColor: '#2E7D32',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginTop: 8,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  teeBoxContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  teeBoxOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  teeBoxActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  teeBoxText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  teeBoxTextActive: {
    color: '#FFFFFF',
  },
  themeInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  themeText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
  logoutButton: {
    margin: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});

export default SettingsScreen;
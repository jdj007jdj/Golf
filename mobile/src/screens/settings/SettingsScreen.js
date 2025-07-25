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
import persistentTileCache from '../../utils/persistentTileCache';
import shotTrackingService from '../../services/shotTrackingService';

const SettingsScreen = ({ navigation }) => {
  const { user, logout, token, accountType, isLocalAccount, convertToOnline } = useAuth();
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
  const [showClubReminders, setShowClubReminders] = useState(settings.scorecard?.showClubReminders ?? true);
  
  // Theme Preferences (preparing for future dark mode)
  const [theme, setTheme] = useState(settings.theme);
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [handicap, setHandicap] = useState(settings.handicap?.toString() || '');
  
  // Map Cache Settings
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [cacheLimit, setCacheLimit] = useState(100); // MB
  const [cacheStats, setCacheStats] = useState(null);
  
  // Sync Settings
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  
  // Local account conversion state
  const [isConverting, setIsConverting] = useState(false);
  const [localDataStats, setLocalDataStats] = useState(null);
  
  // GPS Shot Tracking Settings
  const [isShotTrackingEnabled, setIsShotTrackingEnabled] = useState(
    settings.shotTracking?.enabled ?? true
  );
  

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
      
      // Load cache settings
      await loadCacheSettings();
      
      // Load sync status
      await loadSyncStatus();
      
      // Load local data stats if local account
      if (isLocalAccount) {
        await loadLocalDataStats();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadLocalDataStats = async () => {
    try {
      const roundsData = await AsyncStorage.getItem(`local_rounds_${user?.id}`);
      const shotsData = await AsyncStorage.getItem(`local_shots_${user?.id}`);
      const gamesData = await AsyncStorage.getItem(`local_games_${user?.id}`);
      
      const rounds = roundsData ? JSON.parse(roundsData) : [];
      const shots = shotsData ? JSON.parse(shotsData) : [];
      const games = gamesData ? JSON.parse(gamesData) : [];
      
      setLocalDataStats({
        rounds: rounds.length,
        shots: shots.length,
        games: games.length
      });
    } catch (error) {
      console.error('Error loading local data stats:', error);
    }
  };
  
  const loadCacheSettings = async () => {
    try {
      // Get current cache settings
      const cacheSettings = persistentTileCache.settings;
      setCacheEnabled(cacheSettings.enabled);
      setCacheLimit(cacheSettings.storageLimit / 1024 / 1024); // Convert to MB
      
      // Get cache stats
      const stats = persistentTileCache.getStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Error loading cache settings:', error);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const status = await shotTrackingService.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const handleSyncNow = async () => {
    if (syncInProgress) return;
    
    setSyncInProgress(true);
    
    try {
      console.log('🔄 Manual sync triggered from settings');
      
      // Get queue service for direct access to sync results
      const offlineQueue = await import('../../services/offlineQueueService');
      const queueService = offlineQueue.default;
      
      // Force sync and get results
      await shotTrackingService.forceSyncAll();
      
      // Try to sync the queue and get detailed results
      const syncResults = await queueService.syncQueue();
      
      // Update sync status
      await loadSyncStatus();
      
      // Check for partial success
      if (syncResults && syncResults.length > 0) {
        const successCount = syncResults.filter(r => r.success).length;
        const failCount = syncResults.filter(r => !r.success).length;
        
        if (failCount > 0) {
          // Some items failed
          const failedItems = syncResults.filter(r => !r.success);
          const errorMessages = failedItems.map(item => {
            if (item.item.type === 'shot_sync') {
              return `Shot sync: ${item.error || 'Unknown error'}`;
            }
            return `${item.item.type}: ${item.error || 'Unknown error'}`;
          }).join('\n');
          
          Alert.alert(
            'Partial Sync',
            `Synced ${successCount} items successfully.\n${failCount} items failed:\n\n${errorMessages}`,
            [{ text: 'OK' }]
          );
        } else {
          // All succeeded
          Alert.alert('Success', `All ${successCount} items synced successfully`);
        }
      } else {
        // No items to sync or already synced
        Alert.alert('Success', 'All data is up to date');
      }
      
    } catch (error) {
      console.error('Error during manual sync:', error);
      Alert.alert('Error', `Sync failed: ${error.message}`);
    } finally {
      setSyncInProgress(false);
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
          showClubReminders,
        },
        shotTracking: {
          enabled: isShotTrackingEnabled,
        },
      };
      
      const success = await updateSettings(newSettings);
      
      if (success) {
        // Save cache settings
        await persistentTileCache.saveSettings({
          enabled: cacheEnabled,
          storageLimit: cacheLimit * 1024 * 1024, // Convert MB to bytes
        });
        
        // Update user profile if changed (only for online accounts)
        if (!isLocalAccount && token && (firstName !== user?.firstName || lastName !== user?.lastName || handicap)) {
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

  const handleClearCache = () => {
    Alert.alert(
      'Clear Map Cache',
      'This will delete all offline map tiles. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              persistentTileCache.clearAll();
              await loadCacheSettings(); // Reload stats
              Alert.alert('Success', 'Map cache cleared successfully');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleCacheLimitChange = (value) => {
    setCacheLimit(value);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
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
  
  const handleConvertToOnline = () => {
    Alert.alert(
      'Convert to Online Account',
      `This will upload your local data to the cloud:\n\n• ${localDataStats?.rounds || 0} rounds\n• ${localDataStats?.shots || 0} shots\n• ${localDataStats?.games || 0} games\n\nYou'll need to provide an email and password for your online account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            navigation.navigate('ConvertAccount', { localDataStats });
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
        {/* Account Type Section */}
        {renderSectionHeader('Account Type')}
        <View style={styles.section}>
          <View style={styles.accountTypeCard}>
            <View style={styles.accountTypeHeader}>
              <Text style={styles.accountTypeLabel}>
                {isLocalAccount ? '📱 Local Device Only' : '☁️ Online Account'}
              </Text>
              <Text style={styles.accountTypeValue}>{user?.username || 'Unknown'}</Text>
            </View>
            {isLocalAccount && (
              <>
                <Text style={styles.accountTypeDescription}>
                  Your data is stored only on this device
                </Text>
                {localDataStats && (
                  <View style={styles.localDataStats}>
                    <Text style={styles.localDataLabel}>Local Data:</Text>
                    <Text style={styles.localDataValue}>
                      {localDataStats.rounds} rounds, {localDataStats.shots} shots, {localDataStats.games} games
                    </Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.convertButton}
                  onPress={handleConvertToOnline}
                  disabled={isConverting}
                >
                  <Text style={styles.convertButtonText}>
                    {isConverting ? 'Converting...' : 'Convert to Online Account'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            {!isLocalAccount && (
              <Text style={styles.accountTypeDescription}>
                Your data is backed up to the cloud
              </Text>
            )}
          </View>
        </View>
        
        {/* User Profile Section */}
        {renderSectionHeader('User Profile')}
        <View style={styles.section}>
          {!isLocalAccount && renderTextInput('First Name', firstName, setFirstName, 'Enter first name')}
          {!isLocalAccount && renderTextInput('Last Name', lastName, setLastName, 'Enter last name')}
          {!isLocalAccount && renderTextInput('Email', email, setEmail, 'Enter email', 'email-address')}
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
          {renderSwitch('Auto Club Selection', showClubReminders, setShowClubReminders, 'Automatically open club selector when adding shots')}
        </View>

        {/* GPS Shot Tracking Section */}
        {renderSectionHeader('GPS Shot Tracking')}
        <View style={styles.section}>
          {renderSwitch(
            'Enable GPS Shot Tracking', 
            isShotTrackingEnabled, 
            setIsShotTrackingEnabled, 
            'Automatically log GPS coordinates with each shot for distance tracking and course learning'
          )}
          {isShotTrackingEnabled && (
            <View style={styles.gpsInfoContainer}>
              <Text style={styles.gpsInfoTitle}>Features enabled with GPS tracking:</Text>
              <Text style={styles.gpsInfoItem}>• Shot distance measurements</Text>
              <Text style={styles.gpsInfoItem}>• Club distance analytics</Text>
              <Text style={styles.gpsInfoItem}>• Course learning (pin positions)</Text>
              <Text style={styles.gpsInfoItem}>• Shot visualization on map</Text>
              <Text style={styles.gpsInfoNote}>
                Note: GPS tracking requires location permission and works best outdoors with clear sky view.
              </Text>
            </View>
          )}
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

        {/* Map Cache Section */}
        {renderSectionHeader('Map Cache')}
        <View style={styles.section}>
          {renderSwitch('Enable Offline Maps', cacheEnabled, setCacheEnabled, 'Store map tiles for offline use')}
          
          {cacheEnabled && (
            <>
              <Text style={styles.subsectionTitle}>Storage Limit</Text>
              <View style={styles.cacheLimitContainer}>
                {[50, 100, 200, 500, 1000].map((limit) => (
                  <TouchableOpacity
                    key={limit}
                    style={[
                      styles.cacheLimitButton,
                      cacheLimit === limit && styles.cacheLimitActive
                    ]}
                    onPress={() => handleCacheLimitChange(limit)}
                  >
                    <Text style={[
                      styles.cacheLimitText,
                      cacheLimit === limit && styles.cacheLimitTextActive
                    ]}>
                      {limit >= 1000 ? `${limit/1000}GB` : `${limit}MB`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {cacheStats && (
                <View style={styles.cacheStatsContainer}>
                  <Text style={styles.cacheStatsTitle}>Cache Usage</Text>
                  <View style={styles.cacheStatRow}>
                    <Text style={styles.cacheStatLabel}>Memory Cache:</Text>
                    <Text style={styles.cacheStatValue}>
                      {cacheStats.memoryCache.size}/{cacheStats.memoryCache.maxSize} tiles
                    </Text>
                  </View>
                  <View style={styles.cacheStatRow}>
                    <Text style={styles.cacheStatLabel}>Disk Cache:</Text>
                    <Text style={styles.cacheStatValue}>
                      {cacheStats.persistentCache.tileCount} tiles ({formatBytes(cacheStats.persistentCache.totalSize)})
                    </Text>
                  </View>
                  <View style={styles.cacheStatRow}>
                    <Text style={styles.cacheStatLabel}>Storage Used:</Text>
                    <Text style={styles.cacheStatValue}>
                      {formatBytes(cacheStats.persistentCache.totalSize)} / {cacheLimit}MB
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.clearCacheButton} 
                    onPress={handleClearCache}
                  >
                    <Text style={styles.clearCacheText}>Clear Cache</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* Data Sync Section - Only for online accounts */}
        {!isLocalAccount && (
          <>
            {renderSectionHeader('Data Sync')}
            <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.syncButton, syncInProgress && styles.syncButtonDisabled]} 
            onPress={handleSyncNow}
            disabled={syncInProgress}
          >
            <Text style={[styles.syncButtonText, syncInProgress && styles.syncButtonTextDisabled]}>
              {syncInProgress ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
          
          {syncStatus && (
            <View style={styles.syncStatusContainer}>
              <Text style={styles.syncStatusTitle}>Sync Status</Text>
              
              <View style={styles.syncStatusRow}>
                <Text style={styles.syncStatusLabel}>Pending Shots:</Text>
                <Text style={styles.syncStatusValue}>
                  {syncStatus.shots.pendingShots || 0} shots
                </Text>
              </View>
              
              <View style={styles.syncStatusRow}>
                <Text style={styles.syncStatusLabel}>Shots Queue:</Text>
                <Text style={styles.syncStatusValue}>
                  {syncStatus.shots.total || 0} items
                </Text>
              </View>
              
              <View style={styles.syncStatusRow}>
                <Text style={styles.syncStatusLabel}>Course Knowledge:</Text>
                <Text style={styles.syncStatusValue}>
                  {syncStatus.courseKnowledge.total || 0} items
                </Text>
              </View>
              
              <View style={styles.syncStatusRow}>
                <Text style={styles.syncStatusLabel}>Network:</Text>
                <Text style={[
                  styles.syncStatusValue,
                  syncStatus.shots.isOnline ? styles.syncStatusOnline : styles.syncStatusOffline
                ]}>
                  {syncStatus.shots.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
              
              <View style={styles.syncStatusRow}>
                <Text style={styles.syncStatusLabel}>Auth Token:</Text>
                <Text style={[
                  styles.syncStatusValue,
                  token ? styles.syncStatusOnline : styles.syncStatusOffline
                ]}>
                  {token ? 'Available' : 'Not Available'}
                </Text>
              </View>
              
              {/* Show last sync results if available */}
              {syncStatus.lastSyncResults && syncStatus.lastSyncResults.timestamp && (
                <View style={styles.lastSyncSection}>
                  <Text style={styles.lastSyncTitle}>Last Sync Results</Text>
                  <Text style={styles.lastSyncTime}>
                    {new Date(syncStatus.lastSyncResults.timestamp).toLocaleTimeString()}
                  </Text>
                  
                  {syncStatus.lastSyncResults.summary.partialSuccess && (
                    <View style={styles.syncWarning}>
                      <Text style={styles.syncWarningText}>
                        ⚠️ Partial sync: {syncStatus.lastSyncResults.summary.successCount} succeeded, {syncStatus.lastSyncResults.summary.failureCount} failed
                      </Text>
                    </View>
                  )}
                  
                  {syncStatus.lastSyncResults.details.map((detail, index) => (
                    <View key={index} style={styles.syncDetailRow}>
                      <Text style={styles.syncDetailType}>
                        {detail.type === 'shots' ? '📍 Shots' : '🎓 Course Knowledge'}
                      </Text>
                      <Text style={[
                        styles.syncDetailMessage,
                        detail.errors.length > 0 && styles.syncDetailError
                      ]}>
                        {detail.message}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
          </>
        )}

        {/* Developer Tools Section */}
        {renderSectionHeader('Developer Tools')}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.developerButton} 
            onPress={() => navigation.navigate('WearOSTest')}
          >
            <Text style={styles.developerButtonText}>WearOS Communication Test</Text>
            <Text style={styles.developerButtonDescription}>Test phone-watch connectivity</Text>
          </TouchableOpacity>
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
  developerButton: {
    margin: 16,
    paddingVertical: 12,
  },
  developerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
  },
  developerButtonDescription: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 40,
  },
  cacheLimitContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginHorizontal: -5,
  },
  cacheLimitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 5,
    marginBottom: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  cacheLimitActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  cacheLimitText: {
    fontSize: 14,
    color: '#666',
  },
  cacheLimitTextActive: {
    color: '#FFF',
    fontWeight: '500',
  },
  cacheStatsContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  cacheStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  cacheStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cacheStatLabel: {
    fontSize: 14,
    color: '#666',
  },
  cacheStatValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  clearCacheButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF5252',
    alignItems: 'center',
  },
  clearCacheText: {
    fontSize: 16,
    color: '#FF5252',
    fontWeight: '500',
  },
  syncButton: {
    margin: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#999999',
  },
  syncButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  syncButtonTextDisabled: {
    color: '#E0E0E0',
  },
  syncStatusContainer: {
    marginTop: 10,
    marginHorizontal: 16,
    padding: 15,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  syncStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  syncStatusLabel: {
    fontSize: 14,
    color: '#666666',
  },
  syncStatusValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  syncStatusOnline: {
    color: '#2E7D32',
  },
  syncStatusOffline: {
    color: '#FF5252',
  },
  lastSyncSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  lastSyncTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 5,
  },
  lastSyncTime: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 10,
  },
  syncWarning: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  syncWarningText: {
    fontSize: 13,
    color: '#856404',
  },
  syncDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  syncDetailType: {
    fontSize: 13,
    marginRight: 10,
    width: 120,
  },
  syncDetailMessage: {
    fontSize: 13,
    color: '#666666',
    flex: 1,
  },
  syncDetailError: {
    color: '#D32F2F',
  },
  gpsInfoContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  gpsInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 8,
  },
  gpsInfoItem: {
    fontSize: 13,
    color: '#0284C7',
    marginBottom: 4,
    marginLeft: 8,
  },
  gpsInfoNote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  accountTypeCard: {
    padding: 16,
  },
  accountTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  accountTypeValue: {
    fontSize: 16,
    color: '#666666',
  },
  accountTypeDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  localDataStats: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  localDataLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 4,
  },
  localDataValue: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  convertButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  convertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SettingsScreen;
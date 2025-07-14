import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsContext = createContext({});

const SETTINGS_KEY = 'golf_app_settings';

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    measurementSystem: 'imperial',
    defaultTeeBox: 'white',
    showPutts: true,
    autoAdvanceHole: true,
    keepScreenOn: true,
    theme: 'light',
    notificationsEnabled: true,
    handicap: null,
    // Scorecard display options
    scorecard: {
      showHoleDistance: true,
      showHandicapIndex: true,
      showQuickScoreButtons: true,
      showHoleProgress: true,
      showScoreSummary: true,
      showClubSelection: false, // Future feature
      showAchievementNotifications: true, // Phase 2.2.2
      showSmartClubTracking: true, // Phase 2.2.3
    },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prevSettings => ({
          ...prevSettings,
          ...parsedSettings,
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = {
        ...settings,
        ...newSettings,
      };
      
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
      
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  };

  const convertDistance = (value, fromUnit = 'yards') => {
    if (settings.measurementSystem === 'metric') {
      // Convert yards to meters
      if (fromUnit === 'yards') {
        return Math.round(value * 0.9144);
      }
    }
    return value;
  };

  const getDistanceUnit = () => {
    return settings.measurementSystem === 'metric' ? 'm' : 'yds';
  };

  const formatDistance = (value, fromUnit = 'yards') => {
    const converted = convertDistance(value, fromUnit);
    const unit = getDistanceUnit();
    return `${converted} ${unit}`;
  };

  const value = {
    settings,
    isLoading,
    updateSettings,
    convertDistance,
    getDistanceUnit,
    formatDistance,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export default SettingsContext;
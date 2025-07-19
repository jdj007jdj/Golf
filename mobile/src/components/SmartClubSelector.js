/**
 * SmartClubSelector Component
 * 
 * Intelligent club selection with recommendations based on:
 * - Previous club usage on the same hole
 * - Distance-based suggestions
 * - Quick selection for nearby distances
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import clubService from '../services/clubService';
import { calculateDistance } from '../utils/gpsCalculations';
import { useSettings } from '../contexts/SettingsContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SmartClubSelector = ({ 
  visible,
  onClose,
  onClubSelect,
  onDisableForRound,
  holeNumber,
  currentPosition,
  pinPosition,
  courseId
}) => {
  const { settings } = useSettings();
  const [clubs, setClubs] = useState([]);
  const [selectedTab, setSelectedTab] = useState('smart'); // 'smart' or 'all'
  const [distanceToPin, setDistanceToPin] = useState(null);
  const [recommendedClubs, setRecommendedClubs] = useState([]);
  const [holeHistory, setHoleHistory] = useState([]);
  const [mostUsedClub, setMostUsedClub] = useState(null);

  // Helper function to format distance based on user's measurement preference
  const formatDistance = (yards) => {
    if (!yards) return '';
    
    if (settings.measurementSystem === 'metric') {
      const meters = Math.round(yards * 0.9144);
      return `${meters}m`;
    } else {
      return `${yards}y`;
    }
  };

  // Helper function to get distance unit
  const getDistanceUnit = () => {
    return settings.measurementSystem === 'metric' ? 'meters' : 'yards';
  };

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, holeNumber]);

  const loadData = async () => {
    // Load clubs
    await clubService.initialize();
    const activeClubs = clubService.getActiveClubs();
    setClubs(activeClubs);

    // Calculate distance to pin if positions available
    if (currentPosition && pinPosition) {
      const distance = calculateDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        pinPosition.latitude,
        pinPosition.longitude,
        'yards' // Keep internal calculations in yards for consistency
      );
      setDistanceToPin(Math.round(distance));
      
      // Get club recommendations based on distance
      const recommendations = clubService.getClubRecommendations(distance);
      setRecommendedClubs(recommendations);
    }

    // Load hole history
    await loadHoleHistory();
  };

  const loadHoleHistory = async () => {
    try {
      const historyKey = `hole_history_${courseId}_${holeNumber}`;
      const data = await AsyncStorage.getItem(historyKey);
      
      if (data) {
        const history = JSON.parse(data);
        setHoleHistory(history);
        
        // Find most used club
        const clubCounts = {};
        history.forEach(entry => {
          if (entry.clubId) {
            clubCounts[entry.clubId] = (clubCounts[entry.clubId] || 0) + 1;
          }
        });
        
        const mostUsedId = Object.entries(clubCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0];
          
        if (mostUsedId) {
          const club = clubService.getClub(mostUsedId);
          setMostUsedClub(club);
        }
      }
    } catch (error) {
      console.error('Error loading hole history:', error);
    }
  };

  const saveClubUsage = async (clubId) => {
    try {
      const historyKey = `hole_history_${courseId}_${holeNumber}`;
      const existingData = await AsyncStorage.getItem(historyKey);
      const history = existingData ? JSON.parse(existingData) : [];
      
      history.push({
        clubId,
        date: new Date().toISOString(),
        distance: distanceToPin
      });
      
      // Keep only last 10 entries per hole
      const recentHistory = history.slice(-10);
      
      await AsyncStorage.setItem(historyKey, JSON.stringify(recentHistory));
    } catch (error) {
      console.error('Error saving club usage:', error);
    }
  };

  const handleClubSelect = async (club) => {
    await saveClubUsage(club.id);
    onClubSelect(club.id);
    onClose();
  };

  const renderSmartSuggestions = () => {
    return (
      <ScrollView style={styles.suggestionsContainer} showsVerticalScrollIndicator={false}>
        {/* Distance and recommendations header */}
        {distanceToPin && (
          <View style={styles.distanceHeader}>
            <Text style={styles.distanceText}>{formatDistance(distanceToPin)} to pin</Text>
          </View>
        )}

        {/* Most used club on this hole */}
        {mostUsedClub && (
          <View style={styles.suggestionSection}>
            <Text style={styles.suggestionTitle}>Your Favorite on Hole {holeNumber}</Text>
            <TouchableOpacity
              style={[styles.clubCard, styles.favoriteCard]}
              onPress={() => handleClubSelect(mostUsedClub)}
            >
              <View style={styles.clubCardContent}>
                <Text style={styles.clubCardName}>{mostUsedClub.getShortName()}</Text>
                <Text style={styles.clubCardBrand}>{mostUsedClub.brand}</Text>
              </View>
              <View style={styles.clubCardStats}>
                {mostUsedClub.avgDistance && (
                  <Text style={styles.clubCardDistance}>{formatDistance(mostUsedClub.avgDistance)}</Text>
                )}
                <Text style={styles.favoriteLabel}>★ Most Used</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Distance-based recommendations */}
        {recommendedClubs.length > 0 && (
          <View style={styles.suggestionSection}>
            <Text style={styles.suggestionTitle}>Recommended for Distance</Text>
            {recommendedClubs.map((rec, index) => (
              <TouchableOpacity
                key={rec.club.id}
                style={[
                  styles.clubCard,
                  index === 0 && styles.primaryRecommendation
                ]}
                onPress={() => handleClubSelect(rec.club)}
              >
                <View style={styles.clubCardContent}>
                  <Text style={styles.clubCardName}>{rec.club.getShortName()}</Text>
                  <Text style={styles.clubCardBrand}>{rec.club.brand}</Text>
                </View>
                <View style={styles.clubCardStats}>
                  <Text style={styles.clubCardDistance}>{formatDistance(rec.club.avgDistance)}</Text>
                  {rec.difference < 5 && (
                    <Text style={styles.perfectMatch}>Perfect!</Text>
                  )}
                  {rec.difference >= 5 && rec.difference < 15 && (
                    <Text style={styles.goodMatch}>Good fit</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick alternatives */}
        <View style={styles.suggestionSection}>
          <Text style={styles.suggestionTitle}>Quick Alternatives</Text>
          <View style={styles.quickAlternatives}>
            {clubs
              .filter(club => 
                club.avgDistance && 
                !recommendedClubs.find(r => r.club.id === club.id) &&
                club.id !== mostUsedClub?.id
              )
              .sort((a, b) => (a.avgDistance || 0) - (b.avgDistance || 0))
              .slice(0, 6)
              .map(club => (
                <TouchableOpacity
                  key={club.id}
                  style={styles.quickClubButton}
                  onPress={() => handleClubSelect(club)}
                >
                  <Text style={styles.quickClubName}>{club.getShortName()}</Text>
                  <Text style={styles.quickClubDistance}>{formatDistance(club.avgDistance)}</Text>
                </TouchableOpacity>
              ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderAllClubs = () => {
    const clubsByCategory = clubService.getClubsByCategory();
    
    return (
      <ScrollView style={styles.allClubsContainer} showsVerticalScrollIndicator={false}>
        {Object.entries(clubsByCategory).map(([category, categoryClubs]) => {
          if (categoryClubs.length === 0) return null;

          return (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryHeader}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
              {categoryClubs.map(club => (
                <TouchableOpacity
                  key={club.id}
                  style={styles.clubListItem}
                  onPress={() => handleClubSelect(club)}
                >
                  <View style={styles.clubListContent}>
                    <Text style={styles.clubListName}>{club.getShortName()}</Text>
                    {club.brand && (
                      <Text style={styles.clubListBrand}>{club.brand}</Text>
                    )}
                  </View>
                  {club.avgDistance && (
                    <Text style={styles.clubListDistance}>{formatDistance(club.avgDistance)}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Club</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tab selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'smart' && styles.activeTab]}
              onPress={() => setSelectedTab('smart')}
            >
              <Text style={[styles.tabText, selectedTab === 'smart' && styles.activeTabText]}>
                Smart Suggestions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
              onPress={() => setSelectedTab('all')}
            >
              <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
                All Clubs
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {selectedTab === 'smart' ? renderSmartSuggestions() : renderAllClubs()}
          
          {/* Disable for round option */}
          {onDisableForRound && (
            <TouchableOpacity 
              style={styles.disableButton}
              onPress={() => {
                onDisableForRound();
                onClose();
              }}
            >
              <Text style={styles.disableButtonText}>Don't track clubs this round</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: screenHeight * 0.85,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 28,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    margin: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#2E7D32',
  },
  suggestionsContainer: {
    flex: 1,
    padding: 16,
  },
  distanceHeader: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E7D32',
  },
  suggestionSection: {
    marginBottom: 24,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  clubCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  favoriteCard: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB74D',
  },
  primaryRecommendation: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  clubCardContent: {
    flex: 1,
  },
  clubCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  clubCardBrand: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clubCardStats: {
    alignItems: 'flex-end',
  },
  clubCardDistance: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2E7D32',
  },
  favoriteLabel: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 4,
  },
  perfectMatch: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 4,
  },
  goodMatch: {
    fontSize: 12,
    color: '#66BB6A',
    marginTop: 4,
  },
  quickAlternatives: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  quickClubButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    margin: 6,
    width: (screenWidth - 64) / 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickClubName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  quickClubDistance: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  allClubsContainer: {
    flex: 1,
    padding: 16,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 10,
    paddingLeft: 5,
  },
  clubListItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  clubListContent: {
    flex: 1,
  },
  clubListName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  clubListBrand: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clubListDistance: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2E7D32',
  },
  disableButton: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  disableButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default SmartClubSelector;
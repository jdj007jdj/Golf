/**
 * ClubSelector Component
 * 
 * Modern club selection UI for shot tracking
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
import clubService from '../services/clubService';

const { width: screenWidth } = Dimensions.get('window');

const ClubSelector = ({ 
  selectedClubId, 
  onClubSelect, 
  showLabel = true,
  compactMode = false 
}) => {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [recentClubs, setRecentClubs] = useState([]);

  useEffect(() => {
    loadClubs();
  }, []);

  useEffect(() => {
    if (selectedClubId) {
      const club = clubService.getClub(selectedClubId);
      setSelectedClub(club);
      
      // Update recent clubs
      if (club) {
        setRecentClubs(prev => {
          const filtered = prev.filter(c => c.id !== club.id);
          return [club, ...filtered].slice(0, 3);
        });
      }
    }
  }, [selectedClubId]);

  const loadClubs = async () => {
    await clubService.initialize();
    const activeClubs = clubService.getActiveClubs();
    setClubs(activeClubs);
  };

  const handleClubSelect = (club) => {
    setSelectedClub(club);
    onClubSelect(club.id);
    setShowModal(false);
  };

  const renderQuickSelect = () => {
    if (compactMode || recentClubs.length === 0) return null;

    return (
      <View style={styles.quickSelectContainer}>
        <Text style={styles.quickSelectLabel}>Recent:</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.quickSelectScroll}
        >
          {recentClubs.map(club => (
            <TouchableOpacity
              key={club.id}
              style={[
                styles.quickSelectClub,
                selectedClub?.id === club.id && styles.quickSelectClubActive
              ]}
              onPress={() => handleClubSelect(club)}
            >
              <Text style={[
                styles.quickSelectText,
                selectedClub?.id === club.id && styles.quickSelectTextActive
              ]}>
                {club.getShortName()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCompactSelector = () => (
    <TouchableOpacity
      style={styles.compactButton}
      onPress={() => setShowModal(true)}
    >
      <Text style={styles.compactButtonText}>
        {selectedClub ? selectedClub.getShortName() : '🏌️'}
      </Text>
    </TouchableOpacity>
  );

  const renderFullSelector = () => (
    <View style={styles.container}>
      {showLabel && <Text style={styles.label}>Club Selection</Text>}
      
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.selectorContent}>
          <Text style={styles.selectorText}>
            {selectedClub ? selectedClub.getDisplayName() : 'Select Club'}
          </Text>
          {selectedClub && selectedClub.avgDistance && (
            <Text style={styles.distanceText}>
              Avg: {selectedClub.avgDistance}y
            </Text>
          )}
        </View>
        <Text style={styles.selectorArrow}>▼</Text>
      </TouchableOpacity>

      {renderQuickSelect()}
    </View>
  );

  const renderModal = () => (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowModal(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Club</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.clubList} showsVerticalScrollIndicator={false}>
            {clubService.getClubsByCategory && Object.entries(clubService.getClubsByCategory()).map(([category, categoryClubs]) => {
              if (categoryClubs.length === 0) return null;

              return (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryHeader}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  {categoryClubs.map(club => (
                    <TouchableOpacity
                      key={club.id}
                      style={[
                        styles.clubItem,
                        selectedClub?.id === club.id && styles.clubItemActive
                      ]}
                      onPress={() => handleClubSelect(club)}
                    >
                      <View style={styles.clubItemContent}>
                        <Text style={[
                          styles.clubName,
                          selectedClub?.id === club.id && styles.clubNameActive
                        ]}>
                          {club.getShortName()}
                        </Text>
                        {club.brand && (
                          <Text style={styles.clubBrand}>{club.brand}</Text>
                        )}
                      </View>
                      {club.avgDistance && (
                        <Text style={[
                          styles.clubDistance,
                          selectedClub?.id === club.id && styles.clubDistanceActive
                        ]}>
                          {club.avgDistance}y
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <>
      {compactMode ? renderCompactSelector() : renderFullSelector()}
      {renderModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  selectorButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectorContent: {
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectorArrow: {
    fontSize: 12,
    color: '#666',
    marginLeft: 10,
  },
  quickSelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  quickSelectLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
  },
  quickSelectScroll: {
    flex: 1,
  },
  quickSelectClub: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickSelectClubActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  quickSelectText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  quickSelectTextActive: {
    color: '#fff',
  },
  compactButton: {
    backgroundColor: '#f5f5f5',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  compactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 5,
  },
  clubList: {
    padding: 20,
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
  clubItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  clubItemActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  clubItemContent: {
    flex: 1,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clubNameActive: {
    color: '#2E7D32',
  },
  clubBrand: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  clubDistance: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  clubDistanceActive: {
    color: '#2E7D32',
  },
});

export default ClubSelector;
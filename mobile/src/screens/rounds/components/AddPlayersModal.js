import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import friendsService from '../../../services/friendsService';

const { height: screenHeight } = Dimensions.get('window');

const AddPlayersModal = ({ visible, onClose, onAddPlayers, currentPlayers = [] }) => {
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friends, setFriends] = useState([]);
  const [recentFriends, setRecentFriends] = useState([]);
  const [favoriteFriends, setFavoriteFriends] = useState([]);
  const [showNewFriendForm, setShowNewFriendForm] = useState(false);
  const [newFriend, setNewFriend] = useState({ name: '', handicap: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      loadFriends();
    }
  }, [visible]);

  const loadFriends = async () => {
    try {
      const [allFriends, recent, favorites] = await Promise.all([
        friendsService.getFriends(),
        friendsService.getRecentFriends(),
        friendsService.getFavoriteFriends(),
      ]);
      
      setFriends(allFriends);
      setRecentFriends(recent);
      setFavoriteFriends(favorites);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const toggleFriendSelection = (friend) => {
    setSelectedFriends(prev => {
      const isSelected = prev.some(f => f.id === friend.id);
      if (isSelected) {
        return prev.filter(f => f.id !== friend.id);
      } else {
        // Check if we already have 3 friends selected (4 players max including user)
        if (prev.length >= 3) {
          Alert.alert('Maximum Players', 'You can only add up to 3 friends (4 players total)');
          return prev;
        }
        return [...prev, friend];
      }
    });
  };

  const handleAddNewFriend = async () => {
    if (!newFriend.name.trim()) {
      Alert.alert('Error', 'Please enter a friend name');
      return;
    }

    try {
      const friendData = {
        name: newFriend.name.trim(),
        handicap: newFriend.handicap ? parseInt(newFriend.handicap) : null,
      };
      
      const addedFriend = await friendsService.addFriend(friendData);
      
      // Auto-select the new friend
      setSelectedFriends(prev => [...prev, addedFriend]);
      
      // Reset form and reload friends
      setNewFriend({ name: '', handicap: '' });
      setShowNewFriendForm(false);
      loadFriends();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleQuickAddGuest = () => {
    const guestNumber = currentPlayers.filter(p => p.isGuest).length + 1;
    const guest = {
      id: `guest_${Date.now()}`,
      name: `Guest ${guestNumber}`,
      handicap: null,
      isGuest: true,
    };
    
    setSelectedFriends(prev => {
      if (prev.length >= 3) {
        Alert.alert('Maximum Players', 'You can only add up to 3 friends (4 players total)');
        return prev;
      }
      return [...prev, guest];
    });
  };

  const handleConfirm = () => {
    onAddPlayers(selectedFriends);
    setSelectedFriends([]);
    onClose();
  };

  const filteredFriends = searchQuery
    ? friends.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.nickname && f.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : friends;

  const renderFriendItem = (friend, section) => {
    const isSelected = selectedFriends.some(f => f.id === friend.id);
    const isAlreadyPlaying = currentPlayers.some(p => p.friendId === friend.id);
    
    return (
      <TouchableOpacity
        key={friend.id}
        style={[
          styles.friendItem,
          isSelected && styles.friendItemSelected,
          isAlreadyPlaying && styles.friendItemDisabled,
        ]}
        onPress={() => !isAlreadyPlaying && toggleFriendSelection(friend)}
        disabled={isAlreadyPlaying}
      >
        <View style={styles.friendInfo}>
          <Text style={[styles.friendName, isAlreadyPlaying && styles.disabledText]}>
            {friend.name}
            {friend.isFavorite && ' ⭐'}
          </Text>
          <Text style={[styles.friendDetails, isAlreadyPlaying && styles.disabledText]}>
            HCP: {friend.handicap || 'N/A'}
            {friend.roundsPlayed > 0 && ` • ${friend.roundsPlayed} rounds`}
            {isAlreadyPlaying && ' • Already playing'}
          </Text>
        </View>
        <View style={styles.checkbox}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
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
            <Text style={styles.title}>Add Players</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowNewFriendForm(true)}
              >
                <Text style={styles.actionButtonText}>+ New Friend</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleQuickAddGuest}
              >
                <Text style={styles.actionButtonText}>+ Quick Guest</Text>
              </TouchableOpacity>
            </View>

            {/* New Friend Form */}
            {showNewFriendForm && (
              <View style={styles.newFriendForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Friend's Name (e.g., John Smith)"
                  placeholderTextColor="#999"
                  value={newFriend.name}
                  onChangeText={(text) => setNewFriend({ ...newFriend, name: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Handicap Index (e.g., 15) - Optional"
                  placeholderTextColor="#999"
                  value={newFriend.handicap}
                  onChangeText={(text) => setNewFriend({ ...newFriend, handicap: text })}
                  keyboardType="numeric"
                />
                <View style={styles.formButtons}>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => {
                      setShowNewFriendForm(false);
                      setNewFriend({ name: '', handicap: '' });
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.saveButton]}
                    onPress={handleAddNewFriend}
                  >
                    <Text style={styles.saveButtonText}>Add Friend</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Search */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {/* Favorites Section */}
            {favoriteFriends.length > 0 && !searchQuery && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⭐ Favorites</Text>
                {favoriteFriends.map(friend => renderFriendItem(friend, 'favorites'))}
              </View>
            )}

            {/* Recent Section */}
            {recentFriends.length > 0 && !searchQuery && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🕐 Recent</Text>
                {recentFriends.map(friend => renderFriendItem(friend, 'recent'))}
              </View>
            )}

            {/* All Friends Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {searchQuery ? 'Search Results' : '👥 All Friends'} ({filteredFriends.length})
              </Text>
              {filteredFriends.length === 0 ? (
                <Text style={styles.emptyText}>
                  {searchQuery 
                    ? 'No friends found matching your search' 
                    : 'No friends added yet. Use "New Friend" to add your first friend!'}
                </Text>
              ) : (
                filteredFriends.map(friend => renderFriendItem(friend, 'all'))
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.selectionCount}>
              {selectedFriends.length} selected
            </Text>
            <TouchableOpacity
              style={[styles.confirmButton, selectedFriends.length === 0 && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={selectedFriends.length === 0}
            >
              <Text style={styles.confirmButtonText}>
                Add {selectedFriends.length} Player{selectedFriends.length !== 1 ? 's' : ''}
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: screenHeight * 0.75,
    paddingBottom: 20,
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
    maxHeight: screenHeight * 0.55,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  newFriendForm: {
    backgroundColor: '#f5f5f5',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#2e7d32',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendItemSelected: {
    backgroundColor: '#e8f5e9',
  },
  friendItemDisabled: {
    opacity: 0.5,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  friendDetails: {
    fontSize: 14,
    color: '#666',
  },
  disabledText: {
    color: '#999',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#2e7d32',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectionCount: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
});

export default AddPlayersModal;
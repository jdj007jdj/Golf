import AsyncStorage from '@react-native-async-storage/async-storage';

const FRIENDS_STORAGE_KEY = 'golf_friends_database';
const FRIENDS_STATS_KEY = 'golf_friends_stats';

// Simple ID generator using timestamp and random number
const generateId = () => {
  return `friend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

class FriendsService {
  constructor() {
    this.friends = [];
    this.isInitialized = false;
  }

  // Initialize the service and load friends from storage
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      const storedFriends = await AsyncStorage.getItem(FRIENDS_STORAGE_KEY);
      if (storedFriends) {
        this.friends = JSON.parse(storedFriends);
      } else {
        this.friends = [];
        await this.saveFriends();
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing friends service:', error);
      this.friends = [];
    }
  }

  // Save friends to AsyncStorage
  async saveFriends() {
    try {
      await AsyncStorage.setItem(FRIENDS_STORAGE_KEY, JSON.stringify(this.friends));
    } catch (error) {
      console.error('Error saving friends:', error);
      throw error;
    }
  }

  // Add a new friend with deduplication
  async addFriend(friendData) {
    await this.initialize();

    // Check for duplicates by name and email
    const duplicate = this.friends.find(f => 
      f.name.toLowerCase() === friendData.name.toLowerCase() ||
      (friendData.email && f.email && f.email.toLowerCase() === friendData.email.toLowerCase())
    );

    if (duplicate) {
      throw new Error('Friend already exists');
    }

    const newFriend = {
      id: generateId(),
      name: friendData.name,
      nickname: friendData.nickname || '',
      email: friendData.email || '',
      phone: friendData.phone || '',
      handicap: friendData.handicap || null,
      isRegistered: false,
      userId: null,
      addedDate: new Date().toISOString(),
      lastPlayed: null,
      roundsPlayed: 0,
      averageScore: null,
      photo: friendData.photo || null,
      isFavorite: friendData.isFavorite || false,
      notes: friendData.notes || '',
    };

    this.friends.push(newFriend);
    await this.saveFriends();
    
    return newFriend;
  }

  // Get all friends with sorting options
  async getFriends(sortBy = 'name', filterFavorites = false) {
    await this.initialize();

    let friendsList = [...this.friends];

    // Filter favorites if requested
    if (filterFavorites) {
      friendsList = friendsList.filter(f => f.isFavorite);
    }

    // Sort based on criteria
    switch (sortBy) {
      case 'recent':
        friendsList.sort((a, b) => {
          if (!a.lastPlayed && !b.lastPlayed) return 0;
          if (!a.lastPlayed) return 1;
          if (!b.lastPlayed) return -1;
          return new Date(b.lastPlayed) - new Date(a.lastPlayed);
        });
        break;
      case 'rounds':
        friendsList.sort((a, b) => b.roundsPlayed - a.roundsPlayed);
        break;
      case 'handicap':
        friendsList.sort((a, b) => {
          if (a.handicap === null && b.handicap === null) return 0;
          if (a.handicap === null) return 1;
          if (b.handicap === null) return -1;
          return a.handicap - b.handicap;
        });
        break;
      case 'name':
      default:
        friendsList.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return friendsList;
  }

  // Get friend by ID
  async getFriendById(id) {
    await this.initialize();
    return this.friends.find(f => f.id === id);
  }

  // Update friend details
  async updateFriend(id, updates) {
    await this.initialize();

    const friendIndex = this.friends.findIndex(f => f.id === id);
    if (friendIndex === -1) {
      throw new Error('Friend not found');
    }

    // Check for duplicate name/email if updating those fields
    if (updates.name || updates.email) {
      const duplicate = this.friends.find(f => 
        f.id !== id && (
          (updates.name && f.name.toLowerCase() === updates.name.toLowerCase()) ||
          (updates.email && f.email && f.email.toLowerCase() === updates.email.toLowerCase())
        )
      );

      if (duplicate) {
        throw new Error('Another friend already has this name or email');
      }
    }

    this.friends[friendIndex] = {
      ...this.friends[friendIndex],
      ...updates,
      id: this.friends[friendIndex].id, // Ensure ID doesn't change
    };

    await this.saveFriends();
    return this.friends[friendIndex];
  }

  // Delete a friend
  async deleteFriend(id) {
    await this.initialize();

    const friendIndex = this.friends.findIndex(f => f.id === id);
    if (friendIndex === -1) {
      throw new Error('Friend not found');
    }

    this.friends.splice(friendIndex, 1);
    await this.saveFriends();
  }

  // Toggle favorite status
  async toggleFavorite(id) {
    await this.initialize();

    const friend = this.friends.find(f => f.id === id);
    if (!friend) {
      throw new Error('Friend not found');
    }

    friend.isFavorite = !friend.isFavorite;
    await this.saveFriends();
    return friend;
  }

  // Update friend statistics after a round
  async updateFriendStats(friendId, roundData) {
    await this.initialize();

    const friend = this.friends.find(f => f.id === friendId);
    if (!friend) {
      throw new Error('Friend not found');
    }

    // Update last played date
    friend.lastPlayed = new Date().toISOString();
    friend.roundsPlayed += 1;

    // Update average score
    if (roundData.totalScore) {
      if (friend.averageScore === null) {
        friend.averageScore = roundData.totalScore;
      } else {
        // Calculate new average
        const totalScore = friend.averageScore * (friend.roundsPlayed - 1) + roundData.totalScore;
        friend.averageScore = Math.round(totalScore / friend.roundsPlayed);
      }
    }

    // Update handicap if provided
    if (roundData.handicap !== undefined) {
      friend.handicap = roundData.handicap;
    }

    await this.saveFriends();
    return friend;
  }

  // Get recent friends (played within last 30 days)
  async getRecentFriends(limit = 5) {
    await this.initialize();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.friends
      .filter(f => f.lastPlayed && new Date(f.lastPlayed) > thirtyDaysAgo)
      .sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed))
      .slice(0, limit);
  }

  // Get favorite friends
  async getFavoriteFriends() {
    await this.initialize();
    return this.friends.filter(f => f.isFavorite);
  }

  // Search friends by name or nickname
  async searchFriends(query) {
    await this.initialize();

    const searchTerm = query.toLowerCase();
    return this.friends.filter(f => 
      f.name.toLowerCase().includes(searchTerm) ||
      (f.nickname && f.nickname.toLowerCase().includes(searchTerm))
    );
  }

  // Get friends for quick selection (favorites + recent)
  async getQuickSelectFriends() {
    await this.initialize();

    const favorites = await this.getFavoriteFriends();
    const recent = await this.getRecentFriends();

    // Combine and deduplicate
    const quickSelectIds = new Set();
    const quickSelectFriends = [];

    [...favorites, ...recent].forEach(friend => {
      if (!quickSelectIds.has(friend.id)) {
        quickSelectIds.add(friend.id);
        quickSelectFriends.push(friend);
      }
    });

    return quickSelectFriends;
  }

  // Import friends from contacts (future feature)
  async importFromContacts(contacts) {
    // This will be implemented when we add contact integration
    throw new Error('Contact import not yet implemented');
  }

  // Link a local friend to a registered user (future feature)
  async linkToUser(friendId, userId) {
    await this.initialize();

    const friend = this.friends.find(f => f.id === friendId);
    if (!friend) {
      throw new Error('Friend not found');
    }

    friend.isRegistered = true;
    friend.userId = userId;
    
    await this.saveFriends();
    return friend;
  }
}

// Export a singleton instance
export default new FriendsService();
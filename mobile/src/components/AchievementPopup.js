import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const AchievementPopup = ({ visible, achievements = [], onClose }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Start animations when visible
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      scaleAnim.setValue(0.8);
    }
  }, [visible, fadeAnim, slideAnim, scaleAnim]);

  if (!visible || achievements.length === 0) {
    return null;
  }

  // Sort achievements by priority
  const sortedAchievements = [...achievements].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
  });

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>🎉 Achievements Unlocked!</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.achievementsList}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {sortedAchievements.map((achievement, index) => (
                <Animated.View 
                  key={index} 
                  style={[
                    styles.achievementItem,
                    achievement.priority === 'high' && styles.achievementItemHigh,
                    achievement.priority === 'medium' && styles.achievementItemMedium,
                  ]}
                >
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <View style={styles.achievementContent}>
                    <Text style={[
                      styles.achievementTitle,
                      achievement.priority === 'high' && styles.achievementTitleHigh
                    ]}>
                      {achievement.title}
                    </Text>
                    {achievement.description && (
                      <Text style={styles.achievementDescription}>
                        {achievement.description}
                      </Text>
                    )}
                  </View>
                </Animated.View>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Continue Playing</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    maxWidth: width * 0.9,
    minWidth: width * 0.85,
    maxHeight: height * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: '600',
  },
  achievementsList: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    maxHeight: height * 0.4,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  achievementItemHigh: {
    backgroundColor: '#FFF3E0',
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  achievementItemMedium: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  achievementTitleHigh: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#E65100',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
  },
  continueButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default AchievementPopup;
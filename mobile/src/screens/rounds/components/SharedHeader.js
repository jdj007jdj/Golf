import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

const SharedHeader = ({ navigation, onSettingsPress, title, showMapButton, onMapPress, onBackPress }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (onBackPress) {
              onBackPress();
              return;
            }
            
            console.log('[SharedHeader] Back button pressed');
            console.log('[SharedHeader] Current route:', navigation.getState()?.routes?.[navigation.getState()?.index]?.name);
            console.log('[SharedHeader] Navigation state:', JSON.stringify(navigation.getState(), null, 2));
            
            // Use requestAnimationFrame to defer navigation
            requestAnimationFrame(() => {
              try {
                console.log('[SharedHeader] Attempting navigation.goBack()');
                // Use a small timeout to ensure all view updates are complete
                setTimeout(() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                    console.log('[SharedHeader] navigation.goBack() completed');
                  } else {
                    console.log('[SharedHeader] Cannot go back, navigating to Home');
                    navigation.navigate('Home');
                  }
                }, 100);
              } catch (error) {
                console.error('[SharedHeader] Navigation error:', error);
                console.error('[SharedHeader] Error stack:', error.stack);
                // Fallback navigation
                console.log('[SharedHeader] Attempting fallback navigation.reset()');
                setTimeout(() => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                  });
                }, 100);
              }
            });
          }}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.rightButtons}>
          {showMapButton && (
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={onMapPress}
            >
              <Text style={styles.mapText}>📍</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={onSettingsPress}
          >
            <Text style={styles.settingsText}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#2e7d32',
    zIndex: 1000,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    paddingHorizontal: 20,
    paddingVertical: 15,
    zIndex: 1000,
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapButton: {
    padding: 5,
    marginRight: 10,
  },
  mapText: {
    fontSize: 20,
  },
  settingsButton: {
    padding: 5,
  },
  settingsText: {
    color: 'white',
    fontSize: 20,
  },
});

export default SharedHeader;
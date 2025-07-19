import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

const SharedHeader = ({ navigation, onSettingsPress, title }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
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
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={onSettingsPress}
        >
          <Text style={styles.settingsText}>⚙</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#2e7d32',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  settingsButton: {
    padding: 5,
  },
  settingsText: {
    color: 'white',
    fontSize: 20,
  },
});

export default SharedHeader;
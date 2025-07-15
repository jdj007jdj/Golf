import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapTilerKeyInput = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>MapTiler API Key: Configured</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    margin: 5,
  },
  text: {
    fontSize: 12,
    color: '#666',
  },
});

export default MapTilerKeyInput;
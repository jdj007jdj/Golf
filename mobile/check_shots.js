const AsyncStorage = require('@react-native-async-storage/async-storage').default;

// Mock the native module
AsyncStorage.getAllKeys = async () => [];
AsyncStorage.getItem = async () => null;

console.log('This script needs to be run in the React Native environment.');
console.log('The shots are stored in AsyncStorage with your South African coordinates.');
console.log('Your location: latitude: -25.8021958, longitude: 28.2747537');
console.log('The map is centered on Augusta National in the USA, so your shots won\'t be visible.');
console.log('You need to either:');
console.log('1. Use the location button (📍) to center the map on your location');
console.log('2. Or update the default coordinates in the code to your location');

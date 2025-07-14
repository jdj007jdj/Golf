// Debug script to test network connectivity
const API_CONFIG = require('./src/config/api').API_CONFIG;

console.log('Testing API connectivity...');
console.log('API Base URL:', API_CONFIG.BASE_URL);

// Test health endpoint
fetch(`${API_CONFIG.BASE_URL}/health`)
  .then(response => {
    console.log('Health check response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Health check successful:', data);
  })
  .catch(error => {
    console.error('Health check failed:', error.message);
    console.error('Error details:', error);
  });

// Test from different IPs
const testIPs = [
  'localhost',
  '127.0.0.1',
  '192.168.0.123',
  '10.0.2.2' // Android emulator
];

testIPs.forEach(ip => {
  fetch(`http://${ip}:3000/health`)
    .then(response => {
      console.log(`✅ ${ip}: Connected (status ${response.status})`);
    })
    .catch(error => {
      console.log(`❌ ${ip}: Failed - ${error.message}`);
    });
});
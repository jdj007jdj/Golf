/**
 * Simple test script for conversion API endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testConversionAPI() {
  console.log('🧪 Testing Local Account Conversion API Endpoints\n');

  try {
    // Test 1: Check username availability
    console.log('1️⃣ Testing username availability check...');
    const usernameCheck = await axios.get(`${API_BASE}/auth/check-username/testuser123`);
    console.log('✅ Username check response:', usernameCheck.data);

    // Test 2: Check existing username
    console.log('\n2️⃣ Testing existing username check...');
    const existingCheck = await axios.get(`${API_BASE}/auth/check-username/admin`);
    console.log('✅ Existing username response:', existingCheck.data);

    // Test 3: Convert account (this will fail without a real device ID, but tests the endpoint)
    console.log('\n3️⃣ Testing account conversion endpoint...');
    try {
      const conversionData = {
        username: 'testuser123',
        email: 'testuser123@example.com',
        password: 'password123',
        deviceId: 'test-device-123',
        localData: {
          rounds: 5,
          shots: 100,
          games: 2
        }
      };
      
      const conversion = await axios.post(`${API_BASE}/auth/convert-account`, conversionData);
      console.log('✅ Conversion response:', conversion.data);
      
      // If conversion succeeded, test the status endpoint
      if (conversion.data.success) {
        const { token, conversionId } = conversion.data.data;
        
        console.log('\n4️⃣ Testing conversion status endpoint...');
        const status = await axios.get(
          `${API_BASE}/conversion/${conversionId}/status`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ Conversion status:', status.data);
      }
    } catch (error) {
      if (error.response) {
        console.log('❌ Conversion error (expected):', error.response.data);
      } else {
        throw error;
      }
    }

    console.log('\n✅ All API endpoints are responding correctly!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testConversionAPI();
#!/usr/bin/env node

/**
 * Voiceflow Integration Test Script
 * Tests the connection to Voiceflow API and basic functionality
 */

const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') });

// Test configuration
const apiKey = process.env.NEXT_PUBLIC_VOICEFLOW_API_KEY;
const projectId = process.env.NEXT_PUBLIC_VOICEFLOW_PROJECT_ID;
const versionId = process.env.NEXT_PUBLIC_VOICEFLOW_VERSION_ID || 'production';

console.log('🔍 Testing Voiceflow Integration...\n');

// Check environment variables
console.log('📋 Configuration Check:');
console.log(`API Key: ${apiKey ? '✅ Set' : '❌ Missing'}`);
console.log(`Project ID: ${projectId ? '✅ Set' : '❌ Missing'}`);
console.log(`Version ID: ${versionId ? '✅ Set' : '❌ Missing'}\n`);

if (!apiKey || !projectId) {
  console.log('❌ Missing required environment variables!');
  console.log('Please set up your .env.local file with:');
  console.log('NEXT_PUBLIC_VOICEFLOW_API_KEY=VF.DM.your_api_key');
  console.log('NEXT_PUBLIC_VOICEFLOW_PROJECT_ID=your_project_id');
  console.log('NEXT_PUBLIC_VOICEFLOW_VERSION_ID=production');
  process.exit(1);
}

// Test API connection
async function testVoiceflowConnection() {
  const testUserId = `test_user_${Date.now()}`;
  const launchRequest = { type: 'launch' };
  
  console.log('🚀 Testing API Connection...');
  console.log(`User ID: ${testUserId}`);
  
  try {
    const response = await fetch(
      `https://general-runtime.voiceflow.com/state/user/${encodeURIComponent(testUserId)}/interact`,
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'versionID': versionId,
        },
        body: JSON.stringify({ request: launchRequest }),
      }
    );

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
      return false;
    }

    const traces = await response.json();
    console.log('✅ Connection Successful!');
    console.log('📨 Received traces:', traces.length);
    
    traces.forEach((trace, index) => {
      console.log(`  ${index + 1}. Type: ${trace.type}`);
      if (trace.payload?.message) {
        console.log(`     Message: "${trace.payload.message}"`);
      }
    });
    
    return true;
  } catch (error) {
    console.log('❌ Connection Error:', error.message);
    return false;
  }
}

// Test message sending
async function testMessageSending() {
  const testUserId = `test_user_${Date.now()}`;
  const testMessage = 'Hello, I want to buy some flowers';
  
  console.log('\n💬 Testing Message Sending...');
  console.log(`Message: "${testMessage}"`);
  
  try {
    const response = await fetch(
      `https://general-runtime.voiceflow.com/state/user/${encodeURIComponent(testUserId)}/interact`,
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'versionID': versionId,
        },
        body: JSON.stringify({ 
          request: { type: 'text', payload: testMessage } 
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Message Error:', errorText);
      return false;
    }

    const traces = await response.json();
    console.log('✅ Message Sent Successfully!');
    console.log('📨 Bot Response:', traces.length, 'traces');
    
    traces.forEach((trace, index) => {
      if (trace.type === 'speak' && trace.payload?.message) {
        console.log(`  🤖 Bot: "${trace.payload.message}"`);
      }
    });
    
    return true;
  } catch (error) {
    console.log('❌ Message Error:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  const connectionTest = await testVoiceflowConnection();
  const messageTest = await testMessageSending();
  
  console.log('\n📊 Test Results:');
  console.log(`Connection Test: ${connectionTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Message Test: ${messageTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (connectionTest && messageTest) {
    console.log('\n🎉 All tests passed! Your Voiceflow integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check your configuration and bot setup.');
  }
}

runTests().catch(console.error); 
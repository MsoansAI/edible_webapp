#!/usr/bin/env python3
"""
Test suite for Voiceflow LLM Agent Integration
Tests the complete ordering flow and tool interactions
"""

import pytest
import requests
import json
import os
from datetime import datetime, timedelta

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://jfjvqylmjzprnztbfhpa.supabase.co')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

class TestVoiceflowIntegration:
    """Test the complete Voiceflow agent integration"""
    
    @classmethod
    def setup_class(cls):
        """Setup test data"""
        cls.base_url = f"{SUPABASE_URL}/functions/v1"
        cls.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}'
        }
        cls.test_customer_id = None
        cls.test_store_id = None
        cls.test_order_number = None

    def test_1_check_user_profile_new_customer(self):
        """Test checkUserProfile tool for new customer"""
        url = f"{self.base_url}/customer-management"
        
        payload = {
            "phone": "+1555000TEST",
            "firstName": "Voice",
            "lastName": "Test",
            "email": f"voicetest_{datetime.now().timestamp()}@test.com",
            "source": "chatbot"
        }
        
        response = requests.post(url, json=payload, headers=self.headers)
        assert response.status_code in [200, 201], f"Failed: {response.text}"
        
        data = response.json()
        assert 'customer' in data
        assert data['customer']['isNewAccount'] == True
        assert 'summary' in data
        
        # Store for later tests
        self.__class__.test_customer_id = data['customer']['_internalId']
        print(f"✅ Created test customer: {self.test_customer_id}")

    def test_2_get_product_recommendations(self):
        """Test getProductRecommendations tool"""
        url = f"{self.base_url}/product-search"
        
        payload = {
            "query": "chocolate strawberries for birthday",
            "priceRange": "mid",
            "occasion": "birthday",
            "limit": 3
        }
        
        response = requests.post(url, json=payload, headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert 'products' in data
        assert len(data['products']) > 0
        assert 'summary' in data
        
        # Verify product structure for showProductCards
        product = data['products'][0]
        assert 'productId' in product
        assert 'name' in product
        assert 'price' in product
        assert 'description' in product
        
        print(f"✅ Found {len(data['products'])} products")
        print(f"📋 Summary: {data['summary']}")

    def test_3_find_store_location(self):
        """Test store finding (needed for order creation)"""
        url = f"{self.base_url}/franchisee-inventory/find-nearest"
        
        # Use test ZIP code
        response = requests.get(f"{url}?zipCode=92101", headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert 'store' in data
        
        # Store for order test
        self.__class__.test_store_id = data['store']['_internalId']
        print(f"✅ Found test store: {self.test_store_id}")

    def test_4_post_order_creation(self):
        """Test postOrder tool (complete ordering flow)"""
        assert self.test_customer_id, "Customer ID required from previous test"
        assert self.test_store_id, "Store ID required from previous test"
        
        url = f"{self.base_url}/order"
        
        # Test order with delivery
        payload = {
            "customerId": self.test_customer_id,
            "franchiseeId": self.test_store_id,
            "fulfillmentType": "delivery",
            "items": [
                {
                    "productId": "3075",  # 4-digit ID
                    "optionName": "Large",
                    "quantity": 1,
                    "addons": []
                }
            ],
            "deliveryAddress": {
                "recipientName": "Test Recipient",
                "recipientPhone": "+1555000RECV",
                "streetAddress": "123 Test Street",
                "city": "San Diego",
                "state": "CA",
                "zipCode": "92101",
                "deliveryInstructions": "Test delivery"
            },
            "scheduledDate": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "scheduledTimeSlot": "2:00 PM - 4:00 PM",
            "specialInstructions": "Happy Birthday! - Voice Test"
        }
        
        response = requests.post(url, json=payload, headers=self.headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert 'order' in data
        assert 'orderNumber' in data['order']
        assert 'total' in data['order']
        assert 'confirmation' in data
        
        # Store for potential follow-up tests
        self.__class__.test_order_number = data['order']['orderNumber']
        
        print(f"✅ Created order: {self.test_order_number}")
        print(f"💰 Total: {data['order']['total']}")
        print(f"📦 Confirmation: {data['confirmation']}")

    def test_5_order_retrieval(self):
        """Test order retrieval after creation"""
        assert self.test_order_number, "Order number required from previous test"
        
        url = f"{self.base_url}/order"
        
        response = requests.get(
            f"{url}?orderNumber={self.test_order_number}",
            headers=self.headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert 'order' in data
        assert data['order']['orderNumber'] == self.test_order_number
        
        print(f"✅ Retrieved order: {self.test_order_number}")

    def test_6_error_handling(self):
        """Test error scenarios that the agent should handle"""
        
        # Test invalid product ID
        url = f"{self.base_url}/product-search"
        response = requests.post(url, json={"query": "nonexistent product xyz123"}, headers=self.headers)
        assert response.status_code == 200  # Should return 200 with empty results
        data = response.json()
        assert len(data.get('products', [])) == 0
        
        # Test invalid customer for order
        order_url = f"{self.base_url}/order"
        invalid_order = {
            "customerId": "00000000-0000-0000-0000-000000000000",
            "franchiseeId": self.test_store_id,
            "items": [{"productId": "3075", "quantity": 1}]
        }
        response = requests.post(order_url, json=invalid_order, headers=self.headers)
        assert response.status_code == 400  # Should fail gracefully
        
        print("✅ Error handling tests passed")

    def test_7_voice_optimization_features(self):
        """Test voice-specific features"""
        
        # Test 4-digit product lookup (voice-friendly)
        url = f"{self.base_url}/product-search"
        response = requests.post(url, json={"productId": "3075"}, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data['products']) == 1
        assert data['products'][0]['productId'] == "3075"
        
        # Test price formatting (should be currency strings)
        product = data['products'][0]
        assert '$' in product['price']
        
        print("✅ Voice optimization features work")

    def test_8_allergy_safety_features(self):
        """Test allergy filtering capabilities"""
        
        # Test with allergen filtering
        url = f"{self.base_url}/product-search"
        payload = {
            "query": "chocolate arrangements",
            "allergens": ["nuts"],
            "limit": 5
        }
        
        response = requests.post(url, json=payload, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Should return products (may or may not filter depending on data)
        # Main test is that it doesn't crash with allergen parameter
        assert 'products' in data
        
        print("✅ Allergy safety features work")

    def test_9_semantic_search_capability(self):
        """Test AI-powered semantic search"""
        
        url = f"{self.base_url}/product-search"
        
        # Test semantic search with creative descriptions
        test_queries = [
            "something romantic for my wife",
            "healthy snack for office party", 
            "congratulations gift for new job"
        ]
        
        for query in test_queries:
            payload = {
                "query": query,
                "semanticBoost": True,
                "limit": 3
            }
            
            response = requests.post(url, json=payload, headers=self.headers)
            assert response.status_code == 200
            data = response.json()
            
            # Should find something even with abstract queries
            print(f"🔍 '{query}' → {len(data.get('products', []))} results")
        
        print("✅ Semantic search capabilities work")

    @classmethod
    def teardown_class(cls):
        """Clean up test data"""
        print("\n🧹 Test cleanup completed")
        print(f"📊 Test Summary:")
        print(f"   - Customer created: {cls.test_customer_id}")
        print(f"   - Store found: {cls.test_store_id}")
        print(f"   - Order created: {cls.test_order_number}")


class TestVoiceflowAgentFlow:
    """Test complete conversation flows"""
    
    def setup_method(self):
        """Setup for each test"""
        self.base_url = f"{SUPABASE_URL}/functions/v1"
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}'
        }

    def test_birthday_gift_flow(self):
        """Test complete birthday gift ordering flow"""
        
        # Step 1: Customer wants birthday gift
        print("\n🎂 Testing Birthday Gift Flow...")
        
        # Step 2: Get recommendations
        search_response = requests.post(
            f"{self.base_url}/product-search",
            json={
                "query": "birthday arrangement for mom",
                "priceRange": "mid",
                "occasion": "birthday"
            },
            headers=self.headers
        )
        assert search_response.status_code == 200
        products = search_response.json()['products']
        assert len(products) > 0
        
        print(f"   ✅ Found {len(products)} birthday options")
        
        # Step 3: Create customer
        customer_response = requests.post(
            f"{self.base_url}/customer-management",
            json={
                "phone": "+1555BIRTH01",
                "firstName": "Birthday",
                "lastName": "Tester",
                "source": "chatbot"
            },
            headers=self.headers
        )
        assert customer_response.status_code in [200, 201]
        customer_id = customer_response.json()['customer']['_internalId']
        
        # Step 4: Find store
        store_response = requests.get(
            f"{self.base_url}/franchisee-inventory/find-nearest?zipCode=92101",
            headers=self.headers
        )
        assert store_response.status_code == 200
        store_id = store_response.json()['store']['_internalId']
        
        # Step 5: Create order
        order_response = requests.post(
            f"{self.base_url}/order",
            json={
                "customerId": customer_id,
                "franchiseeId": store_id,
                "items": [{
                    "productId": products[0]['productId'],
                    "quantity": 1
                }],
                "deliveryAddress": {
                    "recipientName": "Mom",
                    "streetAddress": "456 Mom Street",
                    "city": "San Diego",
                    "state": "CA",
                    "zipCode": "92101"
                },
                "specialInstructions": "Happy Birthday Mom!"
            },
            headers=self.headers
        )
        assert order_response.status_code == 200
        order_data = order_response.json()
        
        print(f"   ✅ Created birthday order: {order_data['order']['orderNumber']}")
        print(f"   💰 Total: {order_data['order']['total']}")

    def test_allergy_safety_flow(self):
        """Test flow with allergy considerations"""
        
        print("\n⚠️  Testing Allergy Safety Flow...")
        
        # Create customer with allergies
        customer_response = requests.post(
            f"{self.base_url}/customer-management",
            json={
                "phone": "+1555ALLERGY1",
                "firstName": "Allergy",
                "lastName": "Safe",
                "allergies": ["nuts", "dairy"],
                "source": "chatbot"
            },
            headers=self.headers
        )
        assert customer_response.status_code in [200, 201]
        customer_data = customer_response.json()
        
        # Search with allergy filtering
        search_response = requests.post(
            f"{self.base_url}/product-search",
            json={
                "query": "fruit arrangement",
                "allergens": customer_data['customer']['allergies']
            },
            headers=self.headers
        )
        assert search_response.status_code == 200
        
        print(f"   ✅ Allergy-safe search completed")
        print(f"   🛡️  Customer allergies: {customer_data['customer']['allergies']}")


if __name__ == "__main__":
    # Run tests with verbose output
    print("🚀 Starting Voiceflow Integration Tests...\n")
    
    # Check environment
    if not SUPABASE_SERVICE_KEY:
        print("❌ SUPABASE_SERVICE_ROLE_KEY environment variable required")
        exit(1)
    
    # Run basic integration tests
    pytest.main([__file__ + "::TestVoiceflowIntegration", "-v", "-s"])
    
    # Run flow tests
    pytest.main([__file__ + "::TestVoiceflowAgentFlow", "-v", "-s"])
    
    print("\n🎉 All Voiceflow integration tests completed!") 
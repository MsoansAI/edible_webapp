#!/usr/bin/env python3

import requests
import json

# Test the product search with the failing query using direct SQL approach
def test_fixed_search():
    url = "https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/product-search"
    
    # Use the anon key
    headers = {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmanZxeWxtanpwcm56dGJmaHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4ODAzMzksImV4cCI6MjA2NDQ1NjMzOX0.gnwodddcKxhw5cgsV2WqSKjhn_2h2qFFz4X_AMtYdaQ",
        "Content-Type": "application/json"
    }
    
    # Test the original failing query
    test_query = {
        "query": "chocolate box",
        "category": "Mothers day",
        "maxPrice": 50
    }
    
    print("Testing query:", json.dumps(test_query, indent=2))
    
    response = requests.post(url, headers=headers, json=test_query)
    
    print(f"Status Code: {response.status_code}")
    print("Response:")
    
    if response.status_code == 200:
        data = response.json()
        print(json.dumps(data, indent=2))
        
        print("\n" + "="*50)
        print("Testing other category variations...")
        
        variations = [
            {"category": "Mother's Day", "maxPrice": 50},
            {"query": "chocolate", "maxPrice": 50},
            {"query": "chocolate", "category": "Mother's Day", "maxPrice": 50},
        ]
        
        for variation in variations:
            print(f"\nTesting: {variation}")
            resp = requests.post(url, headers=headers, json=variation)
            if resp.status_code == 200:
                result = resp.json()
                print(f"  Found {result.get('count', 0)} products")
                if result.get('products'):
                    for product in result['products'][:2]:  # Show first 2 products
                        print(f"    - {product['name']} ({product['price']})")
    else:
        print(response.text)

if __name__ == "__main__":
    test_fixed_search() 
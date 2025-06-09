#!/usr/bin/env python3

import requests
import json

# Test the product search with the failing query
def test_search_debug():
    url = "https://kpbfjhiglxnkxhxjpfzp.supabase.co/functions/v1/product-search-enhanced"
    headers = {
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwYmZqaGlnbHhua3hoeGpwZnpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTYwNzc5MCwiZXhwIjoyMDUxMTgzNzkwfQ.D1RVVmzCKlRITBpB8XfxAW8F8NJjvFBJhL7hP8BRrfc",
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
        
        # Also test what categories exist
        print("\n" + "="*50)
        print("Testing category variations...")
        
        variations = [
            {"category": "Mother's Day"},
            {"category": "Mothers Day"},
            {"category": "mothers day"},
            {"category": "Mother's day"},
            {"category": "MOTHERS DAY"},
            {"category": "mothers-day"},
            {"query": "mothers day"},
            {"query": "mother day"},
            {"occasion": "mothers day"},
            {"occasion": "Mother's Day"}
        ]
        
        for variation in variations:
            print(f"\nTesting: {variation}")
            resp = requests.post(url, headers=headers, json=variation)
            if resp.status_code == 200:
                result = resp.json()
                print(f"  Found {result.get('count', 0)} products")
                if result.get('debugInfo'):
                    steps = result['debugInfo'].get('steps', [])
                    for step in steps:
                        if 'filtering' in step.lower() or 'category' in step.lower():
                            print(f"  Debug: {step}")
    else:
        print(response.text)

if __name__ == "__main__":
    test_search_debug() 
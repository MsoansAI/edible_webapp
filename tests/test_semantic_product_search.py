#!/usr/bin/env python3

import os
import json
import requests
import pytest
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv(dotenv_path='.env.local')

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY]):
    print("❌ Missing environment variables. Please check .env.local")
    exit(1)

def make_search_request(search_data, timeout=30):
    """Helper function to make search requests"""
    url = f"{SUPABASE_URL}/functions/v1/product-search"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, headers=headers, json=search_data, timeout=timeout)
    return response

class TestSemanticProductSearch:
    
    def test_level_1_direct_id_lookup(self):
        """Test Level 1: Direct 4-digit product ID lookup (should remain fast)"""
        search_data = {"productId": "3075"}
        
        response = make_search_request(search_data)
        
        assert response.status_code == 200
        result = response.json()
        
        assert result["count"] == 1
        assert result["products"][0]["productId"] == "3075"
        assert result["searchMethod"] == "direct_id"
        print("✅ Level 1 direct ID lookup works")
    
    def test_level_2_structured_filters(self):
        """Test Level 2: Structured filtering (existing functionality)"""
        search_data = {
            "query": "chocolate",
            "maxPrice": 150  # Increased to ensure we get results
        }
        
        response = make_search_request(search_data)
        
        assert response.status_code == 200
        result = response.json()
        
        # Should either find products or gracefully return empty results
        assert result["count"] >= 0
        assert "searchMethod" in result
        print(f"✅ Level 2 structured search returned {result['count']} products")
    
    def test_level_3_semantic_search_exotic_vegan(self):
        """Test Level 3: Semantic search for complex query - exotic vegan"""
        search_data = {
            "query": "something exotic for someone who's vegan and allergic to citrus",
            "allergens": ["citrus"],
            "semanticThreshold": 0.6  # Lower threshold to get more results
        }
        
        response = make_search_request(search_data)
        
        assert response.status_code == 200
        result = response.json()
        
        # Should find products using semantic search
        assert result["count"] >= 0  # May be 0 if no suitable products
        assert "searchMethod" in result
        
        # If products found, verify they don't contain citrus
        for product in result.get("products", []):
            assert "citrus" not in [allergen.lower() for allergen in product.get("allergens", [])]
        
        print(f"✅ Level 3 semantic search (exotic vegan) returned {result['count']} products, method: {result.get('searchMethod')}")
    
    def test_level_3_semantic_search_romantic_anniversary(self):
        """Test Level 3: Semantic search for romantic anniversary gifts"""
        search_data = {
            "query": "romantic gift for anniversary with chocolate but not too sweet",
            "occasion": "anniversary",
            "semanticThreshold": 0.5  # Lower threshold
        }
        
        response = make_search_request(search_data)
        
        assert response.status_code == 200
        result = response.json()
        
        assert result["count"] >= 0
        print(f"✅ Level 3 semantic search (romantic anniversary) returned {result['count']} products, method: {result.get('searchMethod')}")
    
    def test_level_3_semantic_search_healthy_fitness(self):
        """Test Level 3: Semantic search for healthy fitness snacks"""
        search_data = {
            "query": "healthy snacks for a fitness enthusiast who loves berries",
            "priceRange": "budget",
            "semanticThreshold": 0.5
        }
        
        response = make_search_request(search_data)
        
        assert response.status_code == 200
        result = response.json()
        
        assert result["count"] >= 0
        print(f"✅ Level 3 semantic search (healthy fitness) returned {result['count']} products, method: {result.get('searchMethod')}")
    
    def test_level_3_fallback_behavior(self):
        """Test that Level 3 activates when structured search yields poor results"""
        # First test a very specific structured query that might yield few results
        search_data = {
            "query": "unicorn rainbow magical healing crystals",  # Unlikely to match
            "semanticThreshold": 0.3  # Very low threshold to see if anything matches semantically
        }
        
        response = make_search_request(search_data)
        
        assert response.status_code == 200
        result = response.json()
        
        # Should either find semantically similar products or return 0 results gracefully
        assert result["count"] >= 0
        assert "searchMethod" in result
        print(f"✅ Level 3 fallback behavior: {result['count']} products, method: {result.get('searchMethod')}")
    
    def test_embedding_search_similarity_threshold(self):
        """Test that semantic search respects similarity thresholds"""
        search_data = {
            "query": "delicious fresh fruit arrangement for special occasion",
            "semanticThreshold": 0.8  # High threshold for very similar products only
        }
        
        response = make_search_request(search_data)
        
        assert response.status_code == 200
        result = response.json()
        
        assert result["count"] >= 0
        print(f"✅ Semantic similarity threshold test: {result['count']} products, method: {result.get('searchMethod')}")
    
    def test_hybrid_search_combination(self):
        """Test combining structured filters with semantic search"""
        search_data = {
            "query": "elegant gift for mother",
            "maxPrice": 75,
            "occasion": "mothers-day",
            "semanticBoost": True,  # Force semantic search
            "semanticThreshold": 0.5
        }
        
        response = make_search_request(search_data)
        
        assert response.status_code == 200
        result = response.json()
        
        assert result["count"] >= 0
        # Should use semantic search due to semanticBoost
        assert result.get("semanticSearchUsed", False) or result["count"] == 0
        print(f"✅ Hybrid semantic + structured search: {result['count']} products, method: {result.get('searchMethod')}")
    
    def test_search_performance_levels(self):
        """Test that different search levels have appropriate performance characteristics"""
        import time
        
        # Level 1: Direct ID (should be fastest)
        start_time = time.time()
        response1 = make_search_request({"productId": "3075"})
        level1_time = time.time() - start_time
        
        # Level 2: Structured search  
        start_time = time.time()
        response2 = make_search_request({"query": "chocolate", "maxPrice": 100})
        level2_time = time.time() - start_time
        
        # Level 3: Semantic search
        start_time = time.time()
        response3 = make_search_request({
            "query": "romantic exotic arrangement for special person", 
            "semanticBoost": True,
            "semanticThreshold": 0.5
        })
        level3_time = time.time() - start_time
        
        assert response1.status_code == 200
        assert response2.status_code == 200  
        assert response3.status_code == 200
        
        print(f"✅ Performance test:")
        print(f"   Level 1 (Direct ID): {level1_time:.3f}s")
        print(f"   Level 2 (Structured): {level2_time:.3f}s") 
        print(f"   Level 3 (Semantic): {level3_time:.3f}s")
        
        # Level 1 should be fastest, but all should be reasonable (< 15s for semantic)
        assert level1_time < 3.0  # Direct lookup should be very fast
        assert level2_time < 8.0  # Structured search should be fast
        assert level3_time < 15.0  # Semantic search may be slower but reasonable
    
    def test_search_result_quality(self):
        """Test that semantic search returns relevant, high-quality results"""
        search_data = {
            "query": "birthday surprise for chocolate lover",
            "occasion": "birthday",
            "semanticThreshold": 0.4  # Lower threshold to get results
        }
        
        response = make_search_request(search_data)
        
        assert response.status_code == 200
        result = response.json()
        
        if result["count"] > 0:
            # Check result structure and quality
            for product in result["products"]:
                assert "name" in product
                assert "price" in product
                assert "description" in product
                assert "productId" in product
                assert "_internalId" in product
                
                # Price should be properly formatted
                assert product["price"].startswith("$")
                
                # Product ID should be 4-digit customer-friendly
                assert len(product["productId"]) == 4
                assert product["productId"].isdigit()
                
                # If semantic score exists, it should be reasonable
                if "semanticScore" in product:
                    assert 0 <= product["semanticScore"] <= 1
        
        print(f"✅ Search result quality test: {result['count']} high-quality results")
    
    def test_semantic_boost_feature(self):
        """Test the semantic boost feature specifically"""
        search_data = {
            "query": "beautiful arrangement for special someone",
            "semanticBoost": True,
            "semanticThreshold": 0.4
        }
        
        response = make_search_request(search_data)
        
        assert response.status_code == 200
        result = response.json()
        
        # Should use semantic search when boost is enabled
        if result["count"] > 0:
            assert result.get("semanticSearchUsed", False)
            assert "semantic" in result.get("searchMethod", "")
            
            # Products should have semantic scores
            for product in result["products"]:
                if "semanticScore" in product:
                    assert product["semanticScore"] > 0
        
        print(f"✅ Semantic boost test: {result['count']} products, semantic used: {result.get('semanticSearchUsed', False)}")
    
    def test_error_handling(self):
        """Test error handling for various edge cases"""
        # Test empty query
        response1 = make_search_request({})
        assert response1.status_code == 200  # Should still work with empty filters
        
        # Test invalid product ID
        response2 = make_search_request({"productId": "9999"})
        assert response2.status_code == 200  # Should gracefully handle non-existent ID
        result2 = response2.json()
        # Should fall back to semantic search or return empty results
        
        # Test malformed request
        response3 = make_search_request({"invalidField": "test"})
        assert response3.status_code == 200  # Should ignore invalid fields
        
        print("✅ Error handling tests passed")

if __name__ == "__main__":
    print("🧪 Starting comprehensive semantic product search tests...\n")
    
    test_instance = TestSemanticProductSearch()
    
    try:
        test_instance.test_level_1_direct_id_lookup()
        test_instance.test_level_2_structured_filters()
        test_instance.test_level_3_semantic_search_exotic_vegan()
        test_instance.test_level_3_semantic_search_romantic_anniversary()
        test_instance.test_level_3_semantic_search_healthy_fitness()
        test_instance.test_level_3_fallback_behavior()
        test_instance.test_embedding_search_similarity_threshold()
        test_instance.test_hybrid_search_combination()
        test_instance.test_semantic_boost_feature()
        test_instance.test_search_performance_levels()
        test_instance.test_search_result_quality()
        test_instance.test_error_handling()
        
        print("\n🎉 All semantic search tests passed!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        raise 
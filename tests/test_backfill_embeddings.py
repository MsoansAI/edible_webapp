# tests/test_backfill_embeddings.py
import pytest
from unittest.mock import patch, MagicMock # For mocking API calls
# Make sure backfill_embeddings.py is in a location Python can import from
# or adjust sys.path. For simplicity, assuming it's in the root or PYTHONPATH is set.
# If backfill_embeddings.py is in the root:
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backfill_embeddings import (
    generate_text_for_embedding,
    get_embedding_from_openai,
    init_clients, # We can test if it tries to load env vars
    EMBEDDING_DIMENSIONS
)

# Sample data for testing generate_text_for_embedding
SAMPLE_PRODUCT_DATA_FULL = {
    "product_info": {
        "name": "Deluxe Fruit Basket",
        "description": "A wonderful assortment of fresh fruits."
    },
    "categories": [
        {"name": "Gifts", "type": "occasion"},
        {"name": "Healthy", "type": "dietary"}
    ],
    "ingredients": ["apple", "banana", "orange"],
    "options": [
        {"option_name": "Large", "description": "Serves 5-7 people"},
        {"option_name": "Small", "description": "Serves 2-3 people"}
    ]
}

SAMPLE_PRODUCT_DATA_MINIMAL = {
    "product_info": {"name": "Basic Apple"}
}

SAMPLE_PRODUCT_DATA_NO_INFO = {}

def test_generate_text_for_embedding_full():
    expected_text = (
        "Product Name: Deluxe Fruit Basket. "
        "Description: A wonderful assortment of fresh fruits. "
        "Categories: Gifts, Healthy. "
        "Key Ingredients: apple, banana, orange. "
        "Available Options: Option: Large (Serves 5-7 people), Option: Small (Serves 2-3 people)"
    )
    assert generate_text_for_embedding(SAMPLE_PRODUCT_DATA_FULL) == expected_text

def test_generate_text_for_embedding_minimal():
    expected_text = "Product Name: Basic Apple"
    assert generate_text_for_embedding(SAMPLE_PRODUCT_DATA_MINIMAL) == expected_text

def test_generate_text_for_embedding_no_info():
    expected_text = ""
    assert generate_text_for_embedding(SAMPLE_PRODUCT_DATA_NO_INFO) == expected_text

def test_generate_text_for_embedding_empty_input():
    assert generate_text_for_embedding({}) == ""
    assert generate_text_for_embedding(None) == ""


@pytest.fixture
def mock_openai_client():
    # This fixture will allow us to mock the OpenAI client within tests
    # We need to patch 'backfill_embeddings.openai_api_client' as that's where it's used
    with patch('backfill_embeddings.openai_api_client') as mock_client:
        yield mock_client

def test_get_embedding_from_openai_success(mock_openai_client):
    # Configure the mock client's behavior
    mock_embedding_data = MagicMock()
    mock_embedding_data.embedding = [0.1] * EMBEDDING_DIMENSIONS # Create a list of correct dimension
    mock_openai_client.embeddings.create.return_value = MagicMock(data=[mock_embedding_data])

    text = "Test text for embedding"
    embedding = get_embedding_from_openai(text)
    
    assert embedding is not None
    assert len(embedding) == EMBEDDING_DIMENSIONS
    mock_openai_client.embeddings.create.assert_called_once_with(
        input=[text.strip()],
        model="text-embedding-ada-002" # or your EMBEDDING_MODEL
    )

def test_get_embedding_from_openai_api_error(mock_openai_client):
    mock_openai_client.embeddings.create.side_effect = Exception("OpenAI API Down")
    
    text = "Another test text"
    embedding = get_embedding_from_openai(text)
    
    assert embedding is None

def test_get_embedding_from_openai_dimension_mismatch(mock_openai_client):
    mock_embedding_data = MagicMock()
    mock_embedding_data.embedding = [0.1] * (EMBEDDING_DIMENSIONS - 1) # Incorrect dimension
    mock_openai_client.embeddings.create.return_value = MagicMock(data=[mock_embedding_data])

    text = "Dimension mismatch test"
    embedding = get_embedding_from_openai(text)
    assert embedding is None

def test_get_embedding_from_openai_no_text():
    assert get_embedding_from_openai("") is None

# To test init_clients properly, we need to patch the module-level variables
# that were set at import time, not os.environ

@patch('backfill_embeddings.create_client') # Mock supabase client creation
@patch('backfill_embeddings.OpenAI')        # Mock openai client creation
@patch('backfill_embeddings.SUPABASE_URL', 'http://test.co')
@patch('backfill_embeddings.SUPABASE_SERVICE_KEY', 'testkey')
@patch('backfill_embeddings.OPENAI_API_KEY', 'testopenaikey')
def test_init_clients_success(mock_openai_constructor, mock_supabase_constructor):
    assert init_clients() is True
    mock_supabase_constructor.assert_called_once_with("http://test.co", "testkey")
    mock_openai_constructor.assert_called_once_with(api_key="testopenaikey")


@patch('backfill_embeddings.SUPABASE_URL', None)
@patch('backfill_embeddings.SUPABASE_SERVICE_KEY', 'testkey')
@patch('backfill_embeddings.OPENAI_API_KEY', 'testopenaikey')
def test_init_clients_missing_env_var():
    assert init_clients() is False

# Integration/E2E test for backfill_embeddings itself would be more involved:
# - Mock both supabase_client and openai_api_client completely.
# - Set up return values for supabase_client.table().select().execute() etc.
# - Check that the correct update calls are made to supabase_client.table().update().eq().execute()
# - This is complex and often done with more dedicated integration testing setups. 
#!/bin/bash

# Test Order Items Endpoint
echo "🧪 Testing Order Items Endpoint..."

# Test 1: Add a second product to the order
echo -e "\n📦 Test 1: Adding Classic Fruit Basket to order..."
curl -X PATCH "https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/order-items" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmanZxeWxtanpwcm56dGJmaHBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk0Njg2MCwiZXhwIjoyMDY0NTIyODYwfQ.CvQF2TfP88Kt1AUd1UtXlv5RWNhDj8QPY1gw_6jx-kU" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "8d92be18-67fa-49b5-b31a-dea925563a86",
    "items": [
      {
        "action": "add",
        "productId": "847f4fea-0e19-448e-bd73-509a87d5d659",
        "quantity": 1,
        "addons": [
          {
            "addonId": "fc2df7ca-1054-469a-868d-e257b41084cc",
            "quantity": 1
          }
        ]
      }
    ],
    "outputType": "streamlined"
  }'

echo -e "\n\n"

# Test 2: Update existing item quantity
echo -e "\n🔄 Test 2: Updating quantity of first item..."
curl -X PATCH "https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/order-items" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmanZxeWxtanpwcm56dGJmaHBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk0Njg2MCwiZXhwIjoyMDY0NTIyODYwfQ.CvQF2TfP88Kt1AUd1UtXlv5RWNhDj8QPY1gw_6jx-kU" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "8d92be18-67fa-49b5-b31a-dea925563a86",
    "items": [
      {
        "action": "update",
        "itemId": "178e5bde-ff22-4316-91e1-261c6f2173c4",
        "quantity": 3
      }
    ],
    "outputType": "streamlined"
  }'

echo -e "\n\n"

# Test 3: Try to modify shipped order (should fail)
echo -e "\n❌ Test 3: Try to modify shipped order (should fail)..."
curl -X PATCH "https://jfjvqylmjzprnztbfhpa.supabase.co/functions/v1/order-items" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmanZxeWxtanpwcm56dGJmaHBhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk0Njg2MCwiZXhwIjoyMDY0NTIyODYwfQ.CvQF2TfP88Kt1AUd1UtXlv5RWNhDj8QPY1gw_6jx-kU" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "a83f937c-c244-46fb-b217-b4f219bc37be",
    "items": [
      {
        "action": "add",
        "productId": "847f4fea-0e19-448e-bd73-509a87d5d659",
        "quantity": 1
      }
    ],
    "outputType": "streamlined"
  }'

echo -e "\n\n✅ Tests completed!" 
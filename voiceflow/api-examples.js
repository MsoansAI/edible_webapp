// Reusable API Integration Examples for Voiceflow
// Copy these functions into your Voiceflow API steps

// Base configuration
const SUPABASE_URL = "https://jfjvqylmjzprnztbfhpa.supabase.co";
const SUPABASE_ANON_KEY = "your_anon_key_here"; // Set in Voiceflow environment

// ============================================================================
// 1. CUSTOMER MANAGEMENT
// ============================================================================

async function lookupCustomer(phoneNumber, firstName = null, email = null) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/customer-management`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        phone: phoneNumber,
        firstName: firstName,
        email: email,
        source: "chatbot"
      })
    });

    const data = await response.json();
    
    // Set Voiceflow variables
    customer_id = data.customer._internalId;
    customer_name = data.customer.firstName;
    customer_phone = data.customer.phone;
    customer_email = data.customer.email;
    customer_allergies = data.customer.allergies || [];
    is_new_customer = data.customer.isNewAccount;
    order_count = data.orderHistory.length;
    
    return data.summary;
  } catch (error) {
    return "I'm having trouble accessing customer information right now. Let me try a different approach.";
  }
}

// ============================================================================
// 2. PRODUCT SEARCH
// ============================================================================

async function searchProducts(query, priceRange = null, allergens = []) {
  try {
    const searchParams = {
      query: query,
      limit: 3
    };
    
    if (priceRange) searchParams.priceRange = priceRange;
    if (allergens.length > 0) searchParams.allergens = allergens;
    if (store_id) searchParams.franchiseeId = store_id;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/product-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(searchParams)
    });

    const data = await response.json();

    if (data.products && data.products.length > 0) {
      // Store first product details for ordering
      product_name = data.products[0].name;
      product_price = data.products[0].basePrice;
      product_id = data.products[0].productId;
      product_internal_id = data.products[0]._internalId;
      product_options = data.products[0].options || [];
      product_description = data.products[0].description;
      
      // Create conversational response
      const productsCount = data.products.length;
      const firstProduct = data.products[0];
      
      return `I found ${productsCount} great option${productsCount > 1 ? 's' : ''} for you. The most popular is ${firstProduct.name} for ${firstProduct.basePrice}. ${firstProduct.description}`;
    } else {
      return data.searchSummary || "I couldn't find products matching your request. Could you describe what you're looking for differently?";
    }
  } catch (error) {
    return "I'm having trouble searching our products right now. Could you tell me the specific product name or number you're looking for?";
  }
}

// Direct product lookup by 4-digit ID
async function getProductById(productId) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/product-search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        productId: productId
      })
    });

    const data = await response.json();

    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      product_name = product.name;
      product_price = product.basePrice;
      product_id = product.productId;
      product_internal_id = product._internalId;
      product_options = product.options || [];
      
      return `Found it! ${product.name} for ${product.basePrice}. ${product.description}`;
    } else {
      return `I couldn't find product ${productId}. Could you double-check the number or describe what you're looking for?`;
    }
  } catch (error) {
    return "I'm having trouble looking up that product. Could you try again?";
  }
}

// ============================================================================
// 3. STORE FINDER
// ============================================================================

async function findNearestStore(zipCode) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/franchisee-inventory/find-nearest?zipCode=${zipCode}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    const data = await response.json();

    if (data.store) {
      // Set store variables
      store_id = data.store._internalId;
      store_name = data.store.name;
      store_phone = data.store.phone;
      store_address = data.store.address;
      delivery_available = data.store.services.delivery.available;
      delivery_fee = data.store.services.delivery.fee;
      delivery_minimum = data.store.services.delivery.minimumOrder;
      pickup_available = data.store.services.pickup.available;
      store_hours_today = data.store.hours.today;
      
      return data.summary;
    } else {
      return `I couldn't find a store for zip code ${zipCode}. Could you try a nearby zip code?`;
    }
  } catch (error) {
    return "I'm having trouble finding store information. Could you provide your zip code again?";
  }
}

// ============================================================================
// 4. ORDER CREATION
// ============================================================================

async function createOrder(orderDetails) {
  try {
    const orderData = {
      customerId: customer_id,
      franchiseeId: store_id,
      fulfillmentType: orderDetails.fulfillmentType || "delivery",
      items: [{
        productId: orderDetails.productId,
        optionName: orderDetails.optionName || null,
        quantity: orderDetails.quantity || 1,
        addons: orderDetails.addons || []
      }],
      scheduledDate: orderDetails.deliveryDate,
      scheduledTimeSlot: orderDetails.timeSlot,
      specialInstructions: orderDetails.giftMessage
    };

    // Add delivery address if delivery order
    if (orderDetails.fulfillmentType === "delivery") {
      orderData.deliveryAddress = {
        recipientName: orderDetails.recipientName,
        recipientPhone: orderDetails.recipientPhone,
        streetAddress: orderDetails.streetAddress,
        city: orderDetails.city,
        state: orderDetails.state,
        zipCode: orderDetails.zipCode,
        deliveryInstructions: orderDetails.deliveryInstructions
      };
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(orderData)
    });

    const data = await response.json();

    if (data.order) {
      // Set order variables
      order_number = data.order.orderNumber;
      order_total = data.order.pricing.totalAmount;
      order_subtotal = data.order.pricing.subtotal;
      order_tax = data.order.pricing.taxAmount;
      
      return data.summary;
    } else {
      return `I had trouble creating your order. ${data.message || 'Could you try again?'}`;
    }
  } catch (error) {
    return "I'm having trouble placing your order right now. Let me connect you with a live agent who can help.";
  }
}

// ============================================================================
// 5. ORDER MODIFICATION
// ============================================================================

async function addItemToOrder(orderNumber, productId, optionName, quantity = 1) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/order-items`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        orderNumber: orderNumber,
        items: [{
          action: "add",
          productId: productId,
          optionName: optionName,
          quantity: quantity
        }]
      })
    });

    const data = await response.json();

    // Handle cancellation prevention
    if (data.action === "cancellation_request") {
      return data.message; // "I understand you want to remove all items. Let me connect you with a live agent..."
    }

    // Normal response
    if (data.order) {
      order_total = data.order.pricing.totalAmount;
      return data.summary;
    } else {
      return `I had trouble updating your order. ${data.message || 'Could you try again?'}`;
    }
  } catch (error) {
    return "I'm having trouble modifying your order. Let me connect you with a live agent.";
  }
}

async function removeItemFromOrder(orderNumber, productId, optionName, quantity = null) {
  try {
    const itemData = {
      action: "remove",
      productId: productId,
      optionName: optionName
    };
    
    if (quantity) itemData.quantity = quantity;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/order-items`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        orderNumber: orderNumber,
        items: [itemData]
      })
    });

    const data = await response.json();

    // Handle cancellation prevention
    if (data.action === "cancellation_request") {
      return data.message; // Redirect to live agent
    }

    // Normal response
    if (data.order) {
      order_total = data.order.pricing.totalAmount;
      return data.summary;
    } else {
      return `I had trouble updating your order. ${data.message || 'Could you try again?'}`;
    }
  } catch (error) {
    return "I'm having trouble modifying your order. Let me connect you with a live agent.";
  }
}

// ============================================================================
// 6. ORDER LOOKUP
// ============================================================================

async function getCustomerLastOrder(customerId) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/order?customerId=${customerId}&latest=true`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    const data = await response.json();

    if (data.order) {
      current_order_number = data.order.orderNumber;
      current_order_total = data.order.pricing.totalAmount;
      current_order_status = data.order.status;
      
      return data.summary;
    } else {
      return "I couldn't find any recent orders for your account.";
    }
  } catch (error) {
    return "I'm having trouble looking up your order history.";
  }
}

async function getOrderByNumber(orderNumber) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/order?orderNumber=${orderNumber}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    const data = await response.json();

    if (data.order) {
      current_order_number = data.order.orderNumber;
      current_order_total = data.order.pricing.totalAmount;
      current_order_status = data.order.status;
      
      return data.summary;
    } else {
      return `I couldn't find order ${orderNumber}. Could you check the order number?`;
    }
  } catch (error) {
    return "I'm having trouble looking up that order.";
  }
}

// ============================================================================
// 7. UTILITY FUNCTIONS
// ============================================================================

// Format phone number to E.164 format
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  return phone; // Return as-is if can't format
}

// Extract price range from natural language
function extractPriceRange(input) {
  const text = input.toLowerCase();
  if (text.includes('budget') || text.includes('cheap') || text.includes('under 40')) {
    return 'budget';
  } else if (text.includes('premium') || text.includes('expensive') || text.includes('over 80')) {
    return 'premium';
  } else if (text.includes('mid') || text.includes('medium') || text.includes('around 50')) {
    return 'mid';
  }
  return null;
}

// Handle API errors gracefully
function handleAPIError(error, context = '') {
  console.error(`API Error in ${context}:`, error);
  
  if (error.message && error.message.includes('rate_limit')) {
    return "I'm processing a lot of requests right now. Let me try again in a moment.";
  } else if (error.message && error.message.includes('validation_failed')) {
    return "There was an issue with the information provided. Could you try again?";
  } else {
    return "I'm having a technical issue. Let me try a different approach or connect you with a live agent.";
  }
}

// ============================================================================
// EXAMPLE USAGE IN VOICEFLOW API STEPS
// ============================================================================

/*
// API Step 1: Customer Lookup
const customerResult = await lookupCustomer(
  formatPhoneNumber(phone_number),
  first_name,
  email_address
);
return customerResult;

// API Step 2: Product Search
const searchResult = await searchProducts(
  customer_request,
  extractPriceRange(customer_request),
  customer_allergies
);
return searchResult;

// API Step 3: Store Finder
const storeResult = await findNearestStore(zip_code);
return storeResult;

// API Step 4: Create Order
const orderResult = await createOrder({
  fulfillmentType: "delivery",
  productId: product_id,
  optionName: selected_option,
  quantity: 1,
  recipientName: recipient_name,
  recipientPhone: recipient_phone,
  streetAddress: delivery_address,
  city: delivery_city,
  state: delivery_state,
  zipCode: delivery_zip,
  deliveryDate: delivery_date,
  timeSlot: delivery_time,
  giftMessage: gift_message
});
return orderResult;
*/ 